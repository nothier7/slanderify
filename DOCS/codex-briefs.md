# Slanderify — Codex Implementation Brief

## Overview
Slanderify is a community-based web app where users can submit and vote on football (soccer) "slander names" for players. Think of it as a mix of banter + leaderboards. Built with **Next.js 15 (App Router, src layout)**, **Tailwind v4**, **Supabase (Postgres + Auth + RLS)**, and **React Query**.

### MVP Features
1. **Submit slander name**: Users submit (slander name, real player name, league).
2. **Players**: Each player has many slander names.
3. **Voting**: Authenticated users can upvote/downvote names.
4. **Leaderboards**: Weekly, monthly, yearly — global + per-league.
5. **Duplicate handling**: Case/spacing/punctuation insensitive.
6. **Moderation**: Reject blocklisted phrases.

---

## What Already Exists
- **Frontend setup**:
  - Next.js 15 with `src/` directory.
  - Tailwind v4 configured with custom tokens in `globals.css`.
  - React Query provider (`src/app/providers.tsx`).
  - shadcn-style UI primitives (`components/ui/button`).
- **Supabase client**:
  - `src/lib/supabase/client.ts` (browser).
  - `src/lib/supabase/server.ts` (server).
- **Validation**:
  - `src/lib/validation.ts` with Zod schemas.
  - `src/lib/constants.ts` with thresholds.
- **Auth**:
  - Magic link page scaffold (`/signin`).
- **API stubs**:
  - `/api/slander/submit`
  - `/api/slander/vote`
  - `/api/leaderboard`
- **Database**:
  - Tables, RLS, and RPCs already created via migration script.

---

## Database Model (Supabase)
- **profiles**: 1:1 with `auth.users`.
- **players**: stores real player names + normalized version + league.
- **slander_names**: linked to players, stores multiple slander names.
- **votes**: up/down votes by user for each slander.
- **blocklist**: banned phrases.
- **RPCs**:
  - `submit_slander_name(realName, league, slanderName)` → inserts/merges slander.
  - `cast_vote(slanderId, vote)` → upsert user vote.

---

## Tasks for Codex

### API Routes
1. **/api/slander/submit (POST)**
   - Validate payload with Zod.
   - Require auth.
   - Optional: run trigram query for similarity suggestions.
   - Call `submit_slander_name` RPC.
   - Return `{ slanderId, similar? }`.

2. **/api/slander/vote (POST)**
   - Validate payload with Zod.
   - Require auth.
   - Call `cast_vote` RPC.
   - Return `{ ok: true }`.

3. **/api/leaderboard (GET)**
   - Accept query params `period=week|month|year` and optional `league`.
   - Query Supabase for top slander names within time window.
   - Return `{ items: [...], total, pageSize }`.

---

### Frontend (Next.js)
- **Home Page**
  - Tabs for week/month/year (`LeaderboardTabs`).
  - League filter (`LeagueFilter`).
  - Display list of `SlanderCard`s with `VoteButtons`.
  - Use React Query (`useQuery`) for leaderboard.
  - Use `useMutation` + optimistic updates for votes.

- **Submit Page**
  - Form with react-hook-form + Zod.
  - Fields: slander name, real name, league (select).
  - On submit → call `/api/slander/submit`.
  - Show "similar slander" warning if API returns suggestions.

- **Player Page**
  - Show all slander names for a player.
  - Include scores and option to add new slander name.

---

### Moderation
- Always check `blocklist` table in `submit_slander_name` (already enforced in SQL).
- Frontend should show a friendly error if the RPC rejects submission.

---

### Auth
- Require login for submitting and voting.
- Unauthenticated users → show toast: “Login to submit or vote.”
- Link to `/signin`.

---

### Guidelines
- **Use `.cursorrules`** file for style and safety.
- **Do not modify `globals.css` or tokens.**
- **Zod validate all API inputs.**
- **No service_role key in client code.**
- Favor optimistic UI for snappy voting experience.

---

## Definition of Done
- API routes wired to Supabase RPCs.
- Home shows live leaderboards with filters.
- Submit page validates and inserts.
- Votes are instant (optimistic) and persist after refresh.
- Auth flow works with magic links.
- Duplicate slander submissions are merged (case/spacing insensitive).
- Blocklist phrases rejected cleanly.

---
