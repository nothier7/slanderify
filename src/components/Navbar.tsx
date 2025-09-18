import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase/server";
import UserMenu from "@/components/UserMenu";
import ThemeToggle from "@/components/ThemeToggle";
import { cn } from "@/lib/cn";
import { buttonVariants } from "@/components/ui/button";

export default async function Navbar() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  let username: string | null = null;
  if (user) {
    const { data: prof } = await supabase.from("profiles").select("username").eq("id", user.id).maybeSingle();
    username = (prof as any)?.username ?? null;
  }

  return (
    <div className="sticky top-0 z-50">
      <nav className="mx-auto max-w-6xl px-4 sm:px-6 py-3">
        <div className="rounded-xl border border-border/20 bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/50">
          <div className="flex items-center justify-between px-4 py-2">
            {/* Left: Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-full bg-primary-500/20 border border-border/30 grid place-items-center text-sm font-semibold">SF</div>
            </Link>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {!user ? (
                <Link href="/signin" className={cn(buttonVariants({ size: "sm" }))}>Try it now</Link>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>Leaderboard</Link>
                  <Link href="/submit" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>Submit</Link>
                  <UserMenu username={username} />
                </div>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
