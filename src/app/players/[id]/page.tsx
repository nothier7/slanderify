import { createSupabaseServer } from "@/lib/supabase/server";
import SlanderCard from "@/components/SlanderCard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteParams = Promise<{ id: string }>;

export default async function PlayerPage({
  params,
}: {
  params: RouteParams;
}) {
  try {
    const { id } = await params;
    const playerId = Number(id);
    const supabase = await createSupabaseServer();

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

    const { data: slanders, error: sErr } = await supabase
      .from("slander_names")
      .select("id, text, submitter:submitted_by(username)")
      .eq("player_id", playerId)
      .limit(500);

    if (sErr) {
      return <main className="min-h-dvh grid place-items-center p-8">Error</main>;
    }

    type SlanderRow = {
      id: number;
      text: string;
      submitter: { username: string | null } | null;
    };

    type SlanderRowRaw = {
      id: number;
      text: string;
      submitter?: { username: string | null }[] | { username: string | null } | null;
    };

    const normalizeOne = <T extends object>(val: T | T[] | null | undefined): T | null =>
      Array.isArray(val) ? (val[0] ?? null) : val ?? null;

    const slandersRaw = (slanders ?? []) as SlanderRowRaw[];
    const slandersTyped: SlanderRow[] = slandersRaw.map((r) => ({
      id: r.id,
      text: r.text,
      submitter: normalizeOne(r.submitter),
    }));

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
        scores.set(v.slander_id, (scores.get(v.slander_id) ?? 0) + v.vote);
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
            {playerTyped.full_name} - {playerTyped.league}
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
  } catch (err) {
    console.error("Failed to render player page", err);
    return (
      <main className="min-h-dvh grid place-items-center p-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="text-muted">We could not load this player right now. Please try again later.</p>
        </div>
      </main>
    );
  }
}
