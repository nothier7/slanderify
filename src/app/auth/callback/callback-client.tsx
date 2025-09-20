"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";

export default function AuthCallbackClient() {
  const search = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"exchanging" | "done" | "error">("exchanging");

  const redirect = search.get("redirect") || "/";
  const code = search.get("code");
  const tokenHash = search.get("token_hash");

  useEffect(() => {
    if (!code && !tokenHash) {
      setStatus("error");
      router.replace(`/signin?redirect=${encodeURIComponent(redirect)}`);
      return;
    }

    const run = async () => {
      const supabase = createSupabaseBrowser();
      const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);

      if (error) {
        const { data } = await supabase.auth.getUser();
        if (!data.user) {
          setStatus("error");
          router.replace(`/signin?redirect=${encodeURIComponent(redirect)}`);
          return;
        }
      }

      setStatus("done");
      router.replace(redirect);
      router.refresh();
    };
    run();
  }, [code, tokenHash, redirect, router]);

  return (
    <main className="min-h-dvh grid place-items-center p-8">
      <div className="text-muted">
        {status === "exchanging" ? "Signing you in..." : status === "done" ? "Signed in." : "Error signing in."}
      </div>
    </main>
  );
}
