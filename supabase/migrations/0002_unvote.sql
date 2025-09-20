-- Add unvote RPC so clients can remove their vote (back to neutral)
drop function if exists public.unvote(bigint);

create or replace function public.unvote(
  in_slander_id bigint
) returns void
language sql
security definer
as $$
delete from public.votes
where user_id = auth.uid() and slander_id = in_slander_id;
$$;

-- Optional: prompt PostgREST to reload schema cache in some setups
-- notify pgrst, 'reload schema';

