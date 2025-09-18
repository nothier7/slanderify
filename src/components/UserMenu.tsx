"use client";
import { useEffect, useRef, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export default function UserMenu({ username }: { username: string | null }) {
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(username ?? "");
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  async function signOut() {
    setPending(true);
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  async function submitUsername(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const res = await fetch("/api/profile/claim-username", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: value }),
    });
    if (!res.ok) {
      const data = await res.json().catch(()=>({}));
      alert(Array.isArray(data.error) ? data.error[0]?.message : data.error ?? "Failed");
    } else {
      window.location.reload();
    }
    setPending(false);
  }

  return (
    <div className="flex items-center gap-2" ref={ref}>
      <div className="text-sm text-muted hidden sm:block">@{username ?? "unknown"}</div>
      <div className="relative">
        <Button size="sm" variant="outline" onClick={()=>setOpen(!open)} disabled={pending}>Account</Button>
        {open && (
          <div className="absolute right-0 mt-2 w-64 card p-3 z-50">
            <div className="text-sm font-medium mb-2">Profile</div>
            <form onSubmit={submitUsername} className="space-y-2">
              <label className="block text-xs text-muted">Username</label>
              <div className="flex items-center gap-2">
                <span className="text-muted">@</span>
                <input
                  className="h-9 px-3 rounded-lg bg-card border border-border/20 outline-none flex-1"
                  value={value}
                  onChange={(e)=>setValue(e.target.value)}
                  pattern="^[a-z0-9_]{3,20}$"
                  minLength={3}
                  maxLength={20}
                  required
                />
              </div>
              <div className="flex items-center justify-between pt-1">
                <Button type="submit" size="sm" disabled={pending}>Save</Button>
                <Button type="button" size="sm" variant="ghost" onClick={signOut} disabled={pending}>Log out</Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
