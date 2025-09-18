import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const protectedPaths = new Set<string>([
  "/submit",      // submission page
]);

function needsUsernamePath(pathname: string) {
  // Paths where a signed-in user must have a claimed username
  if (pathname === "/") return true; // shows leaderboard for signed-in users
  if (pathname.startsWith("/submit")) return true;
  if (pathname.startsWith("/players")) return true;
  return false;
}

function isProtected(pathname: string) {
  if (protectedPaths.has(pathname)) return true;
  // Optionally protect API endpoints for these features
  if (pathname.startsWith("/api/leaderboard")) return true;
  if (pathname.startsWith("/api/slander/")) return true;
  if (pathname.startsWith("/api/profile/")) return true;
  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow auth and static assets without checks
  if (
    pathname.startsWith("/signin") ||
    pathname.startsWith("/auth/callback") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  if (!isProtected(pathname)) {
    return NextResponse.next();
  }

  const res = NextResponse.next({ request: { headers: new Headers(req.headers) } });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const url = req.nextUrl.clone();
    url.pathname = "/signin";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // If username is required on this path, ensure it is set
  if (needsUsernamePath(pathname)) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle();
    if (!prof || !prof.username) {
      const url = req.nextUrl.clone();
      url.pathname = "/onboarding";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  return res;
}

export const config = {
  matcher: ["/(.*)"],
};
