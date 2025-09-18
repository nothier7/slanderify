"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { leagueEnum } from "@/lib/validation";

export default function SubmitPage() {
  const [slander, setSlander] = useState("");
  const [realName, setRealName] = useState("");
  const [league, setLeague] = useState<string>(leagueEnum.options[0]);
  const [submitted, setSubmitted] = useState<number | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const res = await fetch("/api/slander/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slander, realName, league }),
    });
    const data = await res.json().catch(() => ({}));
    setPending(false);
    if (res.ok) {
      setSubmitted(data.slanderId ?? 0);
      setSlander("");
      setRealName("");
    } else {
      alert(data.error ?? "Failed to submit");
    }
  }

  return (
    <main className="min-h-dvh grid place-items-center p-8">
      <form onSubmit={onSubmit} className="card p-6 space-y-3 w-full max-w-md">
        <h1 className="text-2xl font-bold">Submit slander</h1>
        <label className="block space-y-1">
          <div className="text-sm text-muted">Player’s real name</div>
          <input className="h-10 px-3 rounded-lg bg-card border border-border/20 outline-none w-full"
                 value={realName} onChange={(e)=>setRealName(e.target.value)} maxLength={64} required />
        </label>
        <label className="block space-y-1">
          <div className="text-sm text-muted">League</div>
          <select className="h-10 px-3 rounded-lg bg-card border border-border/20 outline-none w-full"
                  value={league} onChange={(e)=>setLeague(e.target.value)}>
            {leagueEnum.options.map((l)=>(<option key={l} value={l}>{l}</option>))}
          </select>
        </label>
        <label className="block space-y-1">
          <div className="text-sm text-muted">Slander name</div>
          <input className="h-10 px-3 rounded-lg bg-card border border-border/20 outline-none w-full"
                 value={slander} onChange={(e)=>setSlander(e.target.value)} maxLength={64} required />
        </label>
        <Button type="submit" disabled={pending}>{pending ? "Submitting…" : "Submit"}</Button>
        {submitted && <div className="text-sm text-muted">Thanks! Submitted id {submitted}.</div>}
      </form>
    </main>
  );
}
