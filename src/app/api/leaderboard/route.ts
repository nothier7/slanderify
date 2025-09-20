import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServer } from "@/lib/supabase/server";
import { LeaderboardQuerySchema } from "@/lib/validation";
import { PAGE_SIZE } from "@/lib/constants";
export const dynamic = "force-dynamic";

function startDateForPeriod(period: "week" | "month" | "year") {
  const now = new Date();
  const d = new Date(now);
  if (period === "week") d.setDate(now.getDate() - 7);
  else if (period === "month") d.setMonth(now.getMonth() - 1);
  else d.setFullYear(now.getFullYear() - 1);
  return d.toISOString();
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const period = url.searchParams.get("period") ?? "week";
    const league = url.searchParams.get("league") ?? undefined;

    const parsed = LeaderboardQuerySchema.parse({ period, league });
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sinceIso = startDateForPeriod(parsed.period);

    // 1) Pull recent votes within the period
    const { data: votes, error: votesErr } = await supabase
      .from("votes")
      .select("slander_id, vote, created_at")
      .gte("created_at", sinceIso)
      .limit(5000);

    if (votesErr) {
      return NextResponse.json({ error: votesErr.message }, { status: 400 });
    }

    // 2) Aggregate score per slander_id
    type VoteRow = { slander_id: number; vote: -1 | 0 | 1; created_at: string };
    const scores = new Map<number, number>();
    const votesTyped = (votes ?? []) as VoteRow[];
    for (const v of votesTyped) {
      const id = v.slander_id;
      const val = v.vote;
      scores.set(id, (scores.get(id) ?? 0) + val);
    }

    const ids = Array.from(scores.keys());

    // 3) Fetch slander + player details for:
    //    - any slander that received votes in the period (ids)
    //    - and any slander CREATED within the period (to include zero-vote entries)
    const baseSelect = supabase
      .from("slander_names")
      .select("id, text, created_at, player:player_id(id, full_name, league), submitter:submitted_by(username)")
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE * 2);

    let slanderQuery = baseSelect.gte("created_at", sinceIso);
    if (ids.length > 0) {
      // Supabase OR filter for union of (id IN ids) OR (created_at >= since)
      const idList = ids.join(",");
      slanderQuery = supabase
        .from("slander_names")
        .select("id, text, created_at, player:player_id(id, full_name, league), submitter:submitted_by(username)")
        .or(`id.in.(${idList}),created_at.gte.${sinceIso}`)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE * 2);
    }

    const { data: slanders, error: sErr } = await slanderQuery;

    if (sErr) {
      return NextResponse.json({ error: sErr.message }, { status: 400 });
    }

    // 4) Merge, filter by league if provided, sort by score
    // 4) Current user votes for these slanders (for UI state)
    type League = "EPL" | "LaLiga" | "SerieA" | "Bundesliga" | "Ligue1";
    type SlanderRow = {
      id: number;
      text: string;
      created_at: string;
      player: { id: number | null; full_name: string; league: League } | null;
      submitter: { username: string | null } | null;
    };
    const slandersTyped = (slanders ?? []) as SlanderRow[];
    const slanderIds = slandersTyped.map((s) => s.id);
    const { data: myVotes } = slanderIds.length
      ? await supabase
          .from("votes")
          .select("slander_id, vote")
          .eq("user_id", user.id)
          .in("slander_id", slanderIds)
      : ({ data: [] as Array<{ slander_id: number; vote: -1 | 0 | 1 }> });
    const myVoteMap = new Map<number, number>();
    const myVotesTyped = (myVotes ?? []) as Array<{ slander_id: number; vote: -1 | 0 | 1 }>;
    for (const v of myVotesTyped) {
      myVoteMap.set(v.slander_id, v.vote);
    }

    const items = slandersTyped
      .map((s) => ({
        id: s.id,
        text: String(s.text),
        player: {
          id: s.player?.id ?? null,
          full_name: s.player?.full_name ?? "",
          league: s.player?.league as League,
        },
        score: scores.get(s.id) ?? 0,
        created_at: s.created_at,
        submitter: { username: s.submitter?.username ?? null },
        userVote: (myVoteMap.get(s.id) as 1 | -1 | 0 | undefined) ?? 0,
      }))
      .filter((row) => (parsed.league ? row.player.league === parsed.league : true))
      .sort((a, b) => (b.score - a.score) || (new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))
      .slice(0, PAGE_SIZE);

    return NextResponse.json({ items });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 422 });
    }
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
