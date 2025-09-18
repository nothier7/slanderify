// src/lib/supabase/server.ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/** Server-only Supabase client (RSC, route handlers, server actions) */
export async function createSupabaseServer() {
  // Next.js 15 requires awaiting cookies() when you’ll read or set cookies.
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // Supabase docs now label this as the "publishable" (anon) key
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // NEW API: return *all* cookies for Supabase internals
        getAll() {
          return cookieStore.getAll();
        },
        // NEW API: set multiple cookies that Supabase returns
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // If called in a Server Component (can’t set cookies there),
            // rely on middleware to refresh and set auth cookies.
          }
        },
      },
    }
  );
}
