"use client";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function OnboardingClient() {
  const [username, setUsername] = useState("");
  const [pending, setPending] = useState(false);
  const search = useSearchParams();
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const res = await fetch("/api/profile/claim-username", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    const data = await res.json().catch(() => ({}));
    setPending(false);
    if (!res.ok) {
      const message = Array.isArray(data.error) ? data.error[0]?.message : data.error ?? "Failed to set username";
      alert(message);
      return;
    }
    const dest = search.get("redirect") || "/";
    router.push(dest);
  }

  return (
    <main className="min-h-dvh grid place-items-center p-8">
      <form onSubmit={onSubmit} className="card p-6 space-y-3 w-full max-w-sm">
        <h1 className="text-2xl font-bold">Choose your username</h1>
        <p className="text-muted text-sm">Lowercase letters, numbers, and underscores. 3-20 chars.</p>
        <div className="flex gap-2 items-center">
          <span className="text-muted">@</span>
          <input
            className="h-10 px-3 rounded-lg bg-card border border-border/20 outline-none flex-1"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            pattern="^[a-z0-9_]{3,20}$"
            minLength={3}
            maxLength={20}
            required
          />
        </div>
        <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save"}</Button>
      </form>
    </main>
  );
}
