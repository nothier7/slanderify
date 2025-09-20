// app/api/leaderboard/route.ts (or your file path)
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
    const period = (url.searchParams.get("period") ?? "week") as "week" | "month" | "year";
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
      scores.set(v.slander_id, (scores.get(v.slander_id) ?? 0) + v.vote);
    }
    const ids = Array.from(scores.keys());

    // 3) Fetch slanders union (recently created OR received votes)
    const baseSelect =
      "id, text, created_at, player:player_id(id, full_name, league), submitter:submitted_by(username)";

    let slanderQuery = supabase
      .from("slander_names")
      .select(baseSelect)
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE * 2);

    if (ids.length > 0) {
      const idList = ids.join(",");
      slanderQuery = supabase
        .from("slander_names")
        .select(baseSelect)
        .or(`id.in.(${idList}),created_at.gte.${sinceIso}`)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE * 2);
    }

    const { data: slanders, error: sErr } = await slanderQuery;
    if (sErr) {
      return NextResponse.json({ error: sErr.message }, { status: 400 });
    }

    // 4) Normalize shapes (player/submitter may be array/object/null)
    type League = "EPL" | "LaLiga" | "SerieA" | "Bundesliga" | "Ligue1";

    type PlayerObj = { id: number | null; full_name: string; league: League };
    type SubmitterObj = { username: string | null };

    type SlanderRow = {
      id: number;
      text: string;
      created_at: string;
      player: PlayerObj | null;
      submitter: SubmitterObj | null;
    };

    // Raw Supabase row could have arrays:
    type PlayerRaw =
      | { id: number | null; full_name: string; league: string }[]
      | { id: number | null; full_name: string; league: string }
      | null
      | undefined;

    type SubmitterRaw =
      | { username: string | null }[]
      | { username: string | null }
      | null
      | undefined;

    type SlanderRowRaw = {
      id: number;
      text: string;
      created_at: string;
      player?: PlayerRaw;
      submitter?: SubmitterRaw;
    };

    const normalizeOne = <T extends object>(val: T | T[] | null | undefined): T | null => {
      if (!val) return null;
      return Array.isArray(val) ? (val[0] ?? null) : val;
    };

    const toLeague = (val: string | null | undefined): League | "" => {
      if (!val) return "";
      // Trust only known leagues; fallback to "" (we'll filter later if needed)
      if (["EPL", "LaLiga", "SerieA", "Bundesliga", "Ligue1"].includes(val)) return val as League;
      return "" as const;
    };

    const slandersRaw = (slanders ?? []) as SlanderRowRaw[];

    const slandersTyped: SlanderRow[] = slandersRaw.map((row) => {
      const playerOne = normalizeOne(row.player) as
        | { id: number | null; full_name: string; league: string }
        | null;

      const submitterOne = normalizeOne(row.submitter) as
        | { username: string | null }
        | null;

      const playerNorm: PlayerObj | null = playerOne
        ? {
            id: typeof playerOne.id === "number" ? playerOne.id : null,
            full_name: playerOne.full_name ?? "",
            league: toLeague(playerOne.league) || ("LaLiga" as League), // pick a harmless default if you prefer
          }
        : null;

      const submitterNorm: SubmitterObj | null = submitterOne
        ? { username: submitterOne.username ?? null }
        : null;

      return {
        id: row.id,
        text: String(row.text),
        created_at: row.created_at,
        player: playerNorm,
        submitter: submitterNorm,
      };
    });

    // 5) Current user votes for these slanders (for UI state)
    const slanderIds = slandersTyped.map((s) => s.id);
    const { data: myVotes } = slanderIds.length
      ? await supabase
          .from("votes")
          .select("slander_id, vote")
          .eq("user_id", user.id)
          .in("slander_id", slanderIds)
      : ({ data: [] as Array<{ slander_id: number; vote: -1 | 0 | 1 }> });

    const myVoteMap = new Map<number, -1 | 0 | 1>();
    const myVotesTyped = (myVotes ?? []) as Array<{ slander_id: number; vote: -1 | 0 | 1 }>;
    for (const v of myVotesTyped) {
      myVoteMap.set(v.slander_id, v.vote);
    }

    // 6) Build response items, filter/sort, paginate
    const items = slandersTyped
      .map((s) => ({
        id: s.id,
        text: s.text,
        player: s.player
          ? {
              id: s.player.id ?? null,
              full_name: s.player.full_name ?? "",
              league: s.player.league as League,
            }
          : { id: null, full_name: "", league: "LaLiga" as League }, // safe default
        score: scores.get(s.id) ?? 0,
        created_at: s.created_at,
        submitter: { username: s.submitter?.username ?? null },
        userVote: myVoteMap.get(s.id) ?? 0,
      }))
      .filter((row) => (parsed.league ? row.player.league === parsed.league : true))
      .sort(
        (a, b) =>
          b.score - a.score ||
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, PAGE_SIZE);

    return NextResponse.json({ items });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 422 });
    }
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
