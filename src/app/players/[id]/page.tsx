// app/players/[id]/page.tsx (or wherever your route is)
import { createSupabaseServer } from "@/lib/supabase/server";
import SlanderCard from "@/components/SlanderCard";

export default async function PlayerPage({
  params,
}: {
  params: { id: string };
}) {
  const playerId = Number(params.id);
  const supabase = await createSupabaseServer();

  // ----- Player info -----
  const { data: players, error: pErr } = await supabase
    .from("players")
    .select("id, full_name, league")
    .eq("id", playerId)
    .limit(1);

  if (pErr || !players || players.length === 0) {
    return <main className="min-h-dvh grid place-items-center p-8">Not found</main>;
  }

  type PlayerRow = { id: number; full_name: string; league: string };
  const playerTyped: PlayerRow = players[0] as PlayerRow;

  // ----- Slander names for this player -----
  // NOTE: Using the submitted_by -> profiles(username) embed shorthand.
  // Depending on your schema, PostgREST may return submitter as an array.
  // We'll normalize it to a single object or null below.
  const { data: slanders, error: sErr } = await supabase
    .from("slander_names")
    .select("id, text, submitter:submitted_by(username)")
    .eq("player_id", playerId)
    .limit(500);

  if (sErr) {
    return <main className="min-h-dvh grid place-items-center p-8">Error</main>;
  }

  // Desired runtime type for rendering:
  type SlanderRow = {
    id: number;
    text: string;
    submitter: { username: string | null } | null;
  };

  // Raw shape from Supabase can be: array/object/null; normalize it.
  type SlanderRowRaw = {
    id: number;
    text: string;
    submitter?: { username: string | null }[] | { username: string | null } | null;
  };

  const slandersRaw = (slanders ?? []) as SlanderRowRaw[];
  const slandersTyped: SlanderRow[] = slandersRaw.map((r) => {
    const sub = r.submitter;
    const normalized =
      Array.isArray(sub) ? (sub[0] ?? null) :
      sub ? sub :
      null;

    return {
      id: r.id,
      text: r.text,
      submitter: normalized,
    };
  });

  // ----- Votes (scores + my vote) -----
  type VoteRow = { slander_id: number; vote: -1 | 0 | 1 };

  const ids = slandersTyped.map((s) => s.id);
  let scores = new Map<number, number>();
  let myVoteMap = new Map<number, -1 | 0 | 1>();

  if (ids.length) {
    const { data: votes } = await supabase
      .from("votes")
      .select("slander_id, vote")
      .in("slander_id", ids)
      .limit(10000);

    scores = new Map<number, number>();
    const votesTyped = (votes ?? []) as VoteRow[];

    for (const v of votesTyped) {
      const current = scores.get(v.slander_id) ?? 0;
      scores.set(v.slander_id, current + v.vote);
    }

    const { data: me } = await supabase.auth.getUser();
    if (me?.user) {
      const { data: myVotes } = await supabase
        .from("votes")
        .select("slander_id, vote")
        .eq("user_id", me.user.id)
        .in("slander_id", ids);

      myVoteMap = new Map<number, -1 | 0 | 1>();
      const myVotesTyped = (myVotes ?? []) as VoteRow[];
      for (const v of myVotesTyped) {
        myVoteMap.set(v.slander_id, v.vote);
      }
    }
  }

  return (
    <main className="min-h-dvh p-6">
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-2xl font-bold">
          {playerTyped.full_name} · {playerTyped.league}
        </h1>

        <div className="space-y-3">
          {slandersTyped.map((s) => (
            <SlanderCard
              key={s.id}
              id={s.id}
              text={s.text}
              player={{
                id: playerTyped.id,
                full_name: playerTyped.full_name,
                league: playerTyped.league,
              }}
              score={scores.get(s.id) ?? 0}
              submitter={{ username: s.submitter?.username ?? null }}
              userVote={myVoteMap.get(s.id) ?? 0}
            />
          ))}

          {slandersTyped.length === 0 && (
            <div className="text-muted">No slander yet.</div>
          )}
        </div>
      </div>
    </main>
  );
}
