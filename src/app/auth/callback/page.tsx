"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const search = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"exchanging" | "done" | "error">("exchanging");

  useEffect(() => {
    const run = async () => {
      const supabase = createSupabaseBrowser();
      const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
      const dest = search.get("redirect") || "/";
      if (error) {
        setStatus("error");
        // fallback: go to signin with redirect
        router.replace(`/signin?redirect=${encodeURIComponent(dest)}`);
        return;
      }
      setStatus("done");
      router.replace(dest);
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-dvh grid place-items-center p-8">
      <div className="text-muted">{status === "exchanging" ? "Signing you in…" : status === "done" ? "Signed in." : "Error signing in."}</div>
    </main>
  );
}

