import Image from "next/image";
import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import UserMenu from "@/components/UserMenu";
import ThemeToggle from "@/components/ThemeToggle";
import { cn } from "@/lib/cn";

export default async function Navbar() {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    let username: string | null = null;
    if (user) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .maybeSingle();
      const profile = prof as { username: string } | null;
      username = profile?.username ?? null;
    }

    return (
      <div className="sticky top-0 z-50">
        <nav className="mx-auto max-w-6xl px-4 sm:px-6 py-3">
          <div className="rounded-xl border border-border/20 bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/50">
            <div className="flex items-center justify-between px-4 py-2">
              <Link href="/" className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-full border border-border/30 bg-card overflow-hidden">
                  <Image
                    src="/slanderify_logo.png"
                    alt="Slanderify logo"
                    width={36}
                    height={36}
                    className="h-full w-full object-cover"
                    priority
                  />
                </div>
              </Link>

              <div className="flex items-center gap-2">
                {(() => {
                  const base =
                    "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 disabled:opacity-50 disabled:pointer-events-none";
                  const sm = "h-9 px-3";
                  const def = "bg-primary-500 text-bg hover:opacity-95";
                  const ghost = "bg-transparent text-foreground hover:bg-card";
                  return !user ? (
                    <Link href="/signin" className={cn(base, sm, def)}>
                      Try it now
                    </Link>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Link href="/" className={cn(base, sm, ghost)}>
                        Leaderboard
                      </Link>
                      <Link href="/submit" className={cn(base, sm, ghost)}>
                        Submit
                      </Link>
                      <UserMenu username={username} />
                    </div>
                  );
                })()}
                <ThemeToggle />
              </div>
            </div>
          </div>
        </nav>
      </div>
    );
  } catch (err) {
    console.error("Navbar failed to load Supabase state", err);
    return (
      <div className="sticky top-0 z-50">
        <nav className="mx-auto max-w-6xl px-4 sm:px-6 py-3">
          <div className="rounded-xl border border-border/20 bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/50">
            <div className="flex items-center justify-between px-4 py-2">
              <Link href="/" className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-full border border-border/30 bg-card overflow-hidden">
                  <Image
                    src="/slanderify_logo.png"
                    alt="Slanderify logo"
                    width={36}
                    height={36}
                    className="h-full w-full object-cover"
                    priority
                  />
                </div>
              </Link>
              <div className="flex items-center gap-2">
                <Link
                  href="/signin"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 h-9 px-3 bg-primary-500 text-bg hover:opacity-95"
                >
                  Try it now
                </Link>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </nav>
      </div>
    );
  }
}
