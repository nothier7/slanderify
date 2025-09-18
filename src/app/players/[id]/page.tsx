import { createSupabaseServer } from "@/lib/supabase/server";
import SlanderCard from "@/components/SlanderCard";

type Params = { params: { id: string } };

export default async function PlayerPage({ params }: Params) {
  const playerId = Number(params.id);
  const supabase = await createSupabaseServer();

  // Player info
  const { data: players, error: pErr } = await supabase
    .from("players")
    .select("id, full_name, league")
    .eq("id", playerId)
    .limit(1);

  if (pErr || !players || players.length === 0) {
    return <main className="min-h-dvh grid place-items-center p-8">Not found</main>;
  }
  const player = players[0];

  // Slander names for this player
  const { data: slanders, error: sErr } = await supabase
    .from("slander_names")
    .select("id, text, submitter:submitted_by(username)")
    .eq("player_id", playerId)
    .limit(500);

  if (sErr) {
    return <main className="min-h-dvh grid place-items-center p-8">Error</main>;
  }

  const ids = (slanders ?? []).map((s) => s.id);
  let scores = new Map<number, number>();
  let myVoteMap = new Map<number, number>();
  if (ids.length) {
    const { data: votes } = await supabase
      .from("votes")
      .select("slander_id, vote")
      .in("slander_id", ids)
      .limit(10000);
    scores = new Map();
    for (const v of votes ?? []) {
      const id = (v as any).slander_id as number;
      const val = (v as any).vote as number;
      scores.set(id, (scores.get(id) ?? 0) + val);
    }

    const { data: me } = await supabase.auth.getUser();
    if (me?.user) {
      const { data: myVotes } = await supabase
        .from("votes")
        .select("slander_id, vote")
        .eq("user_id", me.user.id)
        .in("slander_id", ids);
      myVoteMap = new Map();
      for (const v of myVotes ?? []) {
        myVoteMap.set((v as any).slander_id as number, (v as any).vote as number);
      }
    }
  }

  return (
    <main className="min-h-dvh p-6">
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-2xl font-bold">{player.full_name} · {player.league}</h1>
        <div className="space-y-3">
          {(slanders ?? []).map((s) => (
            <SlanderCard
              key={s.id}
              id={s.id}
              text={s.text as string}
              player={{ id: player.id as number, full_name: player.full_name as string, league: player.league as string }}
              score={scores.get(s.id) ?? 0}
              submitter={{ username: (s as any).submitter?.username ?? null }}
              userVote={(myVoteMap.get(s.id) as 1 | -1 | undefined) ?? 0}
            />
          ))}
          {(!slanders || slanders.length === 0) && <div className="text-muted">No slander yet.</div>}
        </div>
      </div>
    </main>
  );
}

