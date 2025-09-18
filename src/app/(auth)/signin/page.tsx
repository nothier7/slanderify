"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const search = useSearchParams();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createSupabaseBrowser();
    const redirect = search.get("redirect") || "/";
    const emailRedirectTo = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`;
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo } });
    if (!error) setSent(true);
    else alert(error.message);
  }

  return (
    <main className="min-h-dvh grid place-items-center p-8">
      <form onSubmit={onSubmit} className="card p-6 space-y-3 w-full max-w-sm">
        <h1 className="text-2xl font-bold">Sign in</h1>
        <input
          className="h-10 px-3 rounded-lg bg-card border border-border/20 outline-none"
          type="email" placeholder="you@example.com"
          value={email} onChange={(e)=>setEmail(e.target.value)}
          required
        />
        <Button type="submit" disabled={sent}>{sent ? "Check your email" : "Send magic link"}</Button>
      </form>
    </main>
  );
}
