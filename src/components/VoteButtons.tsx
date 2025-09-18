"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  slanderId: number;
  initialScore?: number;
  initialUserVote?: 1 | -1 | 0;
};

export default function VoteButtons({ slanderId, initialScore = 0, initialUserVote = 0 }: Props) {
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState<1 | -1 | 0>(initialUserVote);
  const [pending, start] = useTransition();

  async function cast(nextVote: 1 | -1) {
    if (nextVote === userVote) return; // no-op to prevent double optimistic bumps
    const prev = userVote;
    const delta = nextVote - prev; // -1->1 = +2, 0->1 = +1, 1->-1 = -2, 0->-1 = -1

    start(async () => {
      setUserVote(nextVote);
      setScore((s) => s + delta);
      const res = await fetch("/api/slander/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slanderId, vote: nextVote }),
      });
      if (!res.ok) {
        // revert
        setUserVote(prev);
        setScore((s) => s - delta);
        const { error } = await res.json().catch(() => ({ error: "Failed" }));
        alert(error ?? "Failed to vote");
      }
    });
  }

  const upSelected = userVote === 1;
  const downSelected = userVote === -1;

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant={upSelected ? "default" : "outline"} disabled={pending} onClick={() => cast(1)}>▲</Button>
      <span className="tabular-nums w-8 text-center">{score}</span>
      <Button size="sm" variant={downSelected ? "default" : "outline"} disabled={pending} onClick={() => cast(-1)}>▼</Button>
    </div>
  );
}
