"use client";
import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export default function SignInClient() {
  const [email, setEmail] = useState("");
  const [linkSent, setLinkSent] = useState(false);
  const [pendingProvider, setPendingProvider] = useState<"magic" | "google" | null>(null);
  const search = useSearchParams();

  const buildRedirect = useCallback(() => {
    const redirect = search.get("redirect") || "/";
    return `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`;
  }, [search]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPendingProvider("magic");
    const supabase = createSupabaseBrowser();
    const emailRedirectTo = buildRedirect();
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo } });
    setPendingProvider(null);
    if (!error) {
      setLinkSent(true);
      setEmail("");
    } else {
      alert(error.message);
    }
  }

  async function onGoogleSignIn() {
    setPendingProvider("google");
    const supabase = createSupabaseBrowser();
    const redirectTo = buildRedirect();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });

    if (error) {
      setPendingProvider(null);
      alert(error.message);
    }
  }

  const magicPending = pendingProvider === "magic";
  const googlePending = pendingProvider === "google";

  return (
    <main className="min-h-dvh grid place-items-center p-8">
      <form onSubmit={onSubmit} className="card p-6 space-y-5 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center">Sign in</h1>
        <div className="space-y-2">
          <label className="text-sm text-muted" htmlFor="email">Email</label>
          <input
            id="email"
            className="h-11 px-3 rounded-lg bg-card border border-border/20 outline-none w-full"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={magicPending || googlePending}
          />
        </div>
        <Button
          type="submit"
          className="w-full justify-center"
          disabled={magicPending || googlePending || linkSent}
        >
          {linkSent ? "Check your email" : magicPending ? "Sending..." : "Send magic link"}
        </Button>
        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <span className="w-full border-t border-border/30" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted">or continue with</span>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-center gap-3 border-[#DADCE0] bg-white text-[rgb(60,64,67)] shadow-sm transition hover:bg-[#F8F9FA] focus-visible:ring-[#4285F4]/40 dark:bg-white dark:text-[rgb(60,64,67)]"
          disabled={googlePending || magicPending}
          onClick={onGoogleSignIn}
        >
          <GoogleIcon className="h-5 w-5" />
          <span className="text-sm font-medium">
            {googlePending ? "Redirecting to Google..." : "Sign in with Google"}
          </span>
        </Button>
      </form>
    </main>
  );
}

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 18 18" aria-hidden="true" {...props}>
      <path fill="#EA4335" d="M9 7.24v3.52h4.97c-.22 1.21-.9 2.24-1.91 2.92l3.09 2.4c1.8-1.66 2.84-4.1 2.84-6.99 0-.67-.06-1.32-.17-1.95H9z" />
      <path fill="#34A853" d="M4.73 10.79l-.74.56-2.43 1.89C3 15.9 5.82 17.5 9 17.5c2.43 0 4.47-.8 5.96-2.15l-3.09-2.4c-.83.56-1.89.89-2.87.89-2.21 0-4.08-1.49-4.75-3.54z" />
      <path fill="#4285F4" d="M2.3 5.76A8.48 8.48 0 0 0 1.5 9c0 1.14.24 2.22.7 3.21 0 .01 2.53-1.99 2.53-1.99-.15-.44-.24-.91-.24-1.41 0-.49.09-.97.24-1.41L2.3 5.76z" />
      <path fill="#FBBC05" d="M9 3.54c1.32 0 2.5.45 3.43 1.34l2.57-2.58C13.45.82 11.43 0 9 0 5.82 0 3 1.6 1.56 4.26l2.53 1.99C4.92 5.2 6.79 3.54 9 3.54z" />
      <path fill="none" d="M0 0h18v18H0z" />
    </svg>
  );
}
