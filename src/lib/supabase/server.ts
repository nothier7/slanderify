// src/lib/supabase/server.ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

function getSupabaseCredentials() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase environment variables NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set."
    );
  }

  return { supabaseUrl, supabaseAnonKey };
}

/** Server-only Supabase client (RSC, route handlers, server actions) */
export async function createSupabaseServer() {
  const cookieStore = await cookies();
  const { supabaseUrl, supabaseAnonKey } = getSupabaseCredentials();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        const mutableCookieStore = cookieStore as unknown as {
          set?: (name: string, value: string, options?: unknown) => void;
        };
        const setCookie = typeof mutableCookieStore.set === "function" ? mutableCookieStore.set.bind(cookieStore) : null;

        if (!setCookie) {
          if (process.env.NODE_ENV !== "production") {
            console.info("Supabase cookie update skipped: cookies() is read-only in this context");
          }
          return;
        }

        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            setCookie(name, value, options);
          });
        } catch (err) {
          console.warn("Supabase cookie set failed", err);
        }
      },
    },
  });
}
