"use client";
import { useEffect } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";

export default function AuthExchange() {
  const search = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const hasCode = !!(search.get("code") || search.get("token_hash"));
    if (!hasCode) return;

    const run = async () => {
      const supabase = createSupabaseBrowser();
      await supabase.auth.exchangeCodeForSession(window.location.href);
      const dest = search.get("redirect") || pathname || "/";
      router.replace(dest);
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, pathname]);

  return null;
}

