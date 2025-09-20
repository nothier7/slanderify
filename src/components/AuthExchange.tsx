"use client";
import { useEffect } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";

export default function AuthExchange() {
  const search = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const code = search.get("code");
  const tokenHash = search.get("token_hash");
  const redirect = search.get("redirect");

  useEffect(() => {
    const hasCode = !!(code || tokenHash);
    if (!hasCode) return;
    if (pathname?.startsWith("/auth/callback")) return;

    const run = async () => {
      const supabase = createSupabaseBrowser();
      const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
      if (error) {
        console.error("Supabase auth exchange failed", error);
        return;
      }
      const dest = redirect || pathname || "/";
      router.replace(dest);
      router.refresh();
    };

    run();
  }, [code, tokenHash, redirect, pathname, router]);

  return null;
}
