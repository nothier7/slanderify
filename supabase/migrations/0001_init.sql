-- ============================================
-- Slanderify — Initial Schema (Option A: immutable generated columns)
-- ============================================

-- Extensions (idempotent)
create extension if not exists citext;
create extension if not exists pg_trgm;

-- ---------- Types ----------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'league_t') then
    create type league_t as enum ('EPL','LaLiga','SerieA','Bundesliga','Ligue1');
  end if;
end$$;

-- ---------- Tables ----------
-- Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username citext unique,
  created_at timestamptz not null default now()
);

-- Ensure citext for username on existing DBs
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'username' and data_type <> 'citext'
  ) then
    alter table public.profiles alter column username type citext;
  end if;
end$$;

-- Optional: format/length guard while allowing NULL (pre-claim)
alter table public.profiles
  drop constraint if exists profiles_username_format_chk;
alter table public.profiles
  add constraint profiles_username_format_chk
  check (
    username is null or username ~ '^[a-z0-9_]{3,20}$'
  );

-- Players (unique by normalized_name + league)
-- NOTE: normalized_name generated WITHOUT unaccent (immutable)
create table if not exists public.players (
  id bigserial primary key,
  full_name text not null,
  normalized_name text
    generated always as (
      regexp_replace(lower(full_name), '[^a-z0-9]+', '', 'g')
    ) stored,
  league league_t not null,
  team text,
  created_at timestamptz not null default now()
);

create index if not exists players_league_idx on public.players (league);
create index if not exists players_norm_idx   on public.players (normalized_name);

-- Slander names (one player → many slander names)
-- NOTE: normalized_text generated WITHOUT unaccent (immutable)
create table if not exists public.slander_names (
  id bigserial primary key,
  player_id bigint not null references public.players(id) on delete cascade,
  text citext not null,
  normalized_text text
    generated always as (
      regexp_replace(lower(text::text), '[^a-z0-9]+', '', 'g')
    ) stored,
  submitted_by uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'approved',  -- for future moderation queue
  created_at timestamptz not null default now(),
  unique (player_id, normalized_text)
);

-- Fuzzy search index (soft duplicate warnings)
create index if not exists slander_trgm on public.slander_names
using gin (normalized_text gin_trgm_ops);

-- Votes (idempotent upsert per user+slander)
create table if not exists public.votes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  slander_id bigint not null references public.slander_names(id) on delete cascade,
  vote smallint not null check (vote in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (user_id, slander_id)
);

-- Moderation blocklist (simple substring check server-side)
create table if not exists public.blocklist(
  phrase text primary key,
  created_at timestamptz not null default now()
);

-- Optional helper view for period bucketing
create or replace view public.votes_with_period as
select v.*,
       date_trunc('week',  v.created_at) as week_start,
       date_trunc('month', v.created_at) as month_start,
       date_trunc('year',  v.created_at) as year_start
from public.votes v;

-- ---------- RLS ----------
alter table public.profiles       enable row level security;
alter table public.players        enable row level security;
alter table public.slander_names  enable row level security;
alter table public.votes          enable row level security;
alter table public.blocklist      enable row level security;

-- Profiles policies
drop policy if exists "read profiles"      on public.profiles;
drop policy if exists "insert own profile" on public.profiles;
drop policy if exists "update own profile" on public.profiles;

create policy "read profiles" on public.profiles
  for select using (true);

create policy "insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Players (reads open; writes via RPC or direct insert later if needed)
drop policy if exists "read players" on public.players;

create policy "read players" on public.players
  for select using (true);

-- Slander policies
drop policy if exists "read slander"           on public.slander_names;
drop policy if exists "insert slander (auth)"  on public.slander_names;
drop policy if exists "update own slander"     on public.slander_names;

create policy "read slander" on public.slander_names
  for select using (true);

create policy "insert slander (auth)" on public.slander_names
  for insert with check (
    auth.role() = 'authenticated'
    and submitted_by = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.username is not null
    )
  );

create policy "update own slander" on public.slander_names
  for update using (submitted_by = auth.uid());

-- Votes policies
drop policy if exists "read votes"      on public.votes;
drop policy if exists "upsert my vote"  on public.votes;
drop policy if exists "update my vote"  on public.votes;

create policy "read votes" on public.votes
  for select using (true);

create policy "upsert my vote" on public.votes
  for insert with check (user_id = auth.uid());

create policy "update my vote" on public.votes
  for update using (user_id = auth.uid());

-- Blocklist policies (read open so UI can show examples if needed)
drop policy if exists "read blocklist" on public.blocklist;
create policy "read blocklist" on public.blocklist
  for select using (true);

-- ---------- Auth → Profiles auto-insert ----------
-- Create a profile row on new user sign-up (optional but recommended)
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user;

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, null)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- ---------- RPCs ----------
-- Claim username: one-time set, validates format & uniqueness (case-insensitive)
drop function if exists public.claim_username(text);

create or replace function public.claim_username(
  in_username text
) returns void
language plpgsql
security definer
as $$
declare
  v_uid uuid := auth.uid();
  v_exists boolean;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if in_username is null or length(in_username) < 3 or length(in_username) > 20 or in_username !~ '^[a-z0-9_]+$' then
    raise exception 'Invalid username format';
  end if;

  -- ensure user row exists
  insert into public.profiles (id) values (v_uid) on conflict (id) do nothing;

  -- enforce uniqueness via citext unique constraint (also double-check)
  select exists(select 1 from public.profiles where username = in_username) into v_exists;
  if v_exists then
    raise exception 'Username is taken';
  end if;

  update public.profiles set username = in_username where id = v_uid;
end;
$$;
-- Submit slander name: ensures player exists, dedup per player+normalized_text, blocklist check
drop function if exists public.submit_slander_name(text, league_t, text);

create or replace function public.submit_slander_name(
  in_player_full_name text,
  in_league league_t,
  in_slander_text text
) returns bigint
language plpgsql
security definer
as $$
declare
  v_player_id   bigint;
  v_slander_id  bigint;
  -- NOTE: no unaccent; matches the generated-column logic (immutable)
  v_norm_player  text := regexp_replace(lower(in_player_full_name), '[^a-z0-9]+', '', 'g');
  v_norm_slander text := regexp_replace(lower(in_slander_text),     '[^a-z0-9]+', '', 'g');
begin
  -- Blocklist (substring match, case-insensitive)
  if exists (
    select 1 from public.blocklist b
    where position(lower(b.phrase) in lower(in_slander_text)) > 0
  ) then
    raise exception 'Slander name contains a blocked phrase';
  end if;

  -- Find or create player
  select id into v_player_id
  from public.players
  where normalized_name = v_norm_player
    and league = in_league
  limit 1;

  if v_player_id is null then
    insert into public.players (full_name, league)
    values (in_player_full_name, in_league)
    returning id into v_player_id;
  end if;

  -- Insert or merge slander for that player
  insert into public.slander_names (player_id, text, submitted_by)
  values (v_player_id, in_slander_text, auth.uid())
  on conflict (player_id, normalized_text) do update
    set text = excluded.text
  returning id into v_slander_id;

  return v_slander_id;
end;
$$;

-- Cast vote: idempotent upsert per (user,slander)
drop function if exists public.cast_vote(bigint, smallint);

create or replace function public.cast_vote(
  in_slander_id bigint,
  in_vote smallint
) returns void
language sql
security definer
as $$
insert into public.votes (user_id, slander_id, vote)
values (auth.uid(), in_slander_id, in_vote)
on conflict (user_id, slander_id)
do update set vote = excluded.vote, created_at = now();
$$;

-- ---------- Realtime (optional) ----------
-- If you plan to use Realtime subscriptions on these tables:
do $$
begin
  perform 1
  from pg_publication_tables
  where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'slander_names';
  if not found then
    alter publication supabase_realtime add table public.players, public.slander_names, public.votes;
  end if;
end$$;

-- ---------- Seed (optional) ----------
-- insert into public.players (full_name, league) values
--   ('Kylian Mbappe','Ligue1'),
--   ('Erling Haaland','EPL');
