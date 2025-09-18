"use client";
import { useEffect, useState } from "react";
import LeaderboardTabs from "@/components/LeaderboardTabs";
import LeagueFilter from "@/components/LeagueFilter";
import SlanderCard from "@/components/SlanderCard";

type Period = "week" | "month" | "year";

type Item = {
  id: number;
  text: string;
  player: { id: number | null; full_name: string; league: string };
  score: number;
  submitter?: { username: string | null };
  userVote?: 1 | -1 | 0;
};

export default function LeaderboardView() {
  const [period, setPeriod] = useState<Period>("week");
  const [league, setLeague] = useState<string | undefined>(undefined);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      const params = new URLSearchParams({ period });
      if (league) params.set("league", league);
      const res = await fetch(`/api/leaderboard?${params}`);
      const data = await res.json();
      setItems(data.items ?? []);
      setLoading(false);
    };
    run();
  }, [period, league]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Slanderify</h1>
        <a href="/submit" className="underline">Submit</a>
      </header>

      <div className="flex items-center gap-3">
        <LeaderboardTabs period={period} onChange={setPeriod} />
        <LeagueFilter value={league} onChange={setLeague} />
      </div>

      <section className="space-y-3">
        {loading && <div className="text-muted">Loading…</div>}
        {!loading && items.length === 0 && <div className="text-muted">No slander yet.</div>}
        {items.map((it) => (
          <SlanderCard
            key={it.id}
            id={it.id}
            text={it.text}
            player={it.player}
            score={it.score}
            submitter={it.submitter}
            userVote={it.userVote}
          />
        ))}
      </section>
    </div>
  );
}
