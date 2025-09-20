import { createSupabaseServer } from "@/lib/supabase/server";
import LeaderboardView from "@/components/LeaderboardView";
import LandingPage from "@/components/LandingPage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Home() {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return <LandingPage />;

    return (
      <main className="min-h-dvh p-6">
        <LeaderboardView />
      </main>
    );
  } catch (err) {
    console.error("Failed to render home page", err);
    return (
      <main className="min-h-dvh grid place-items-center p-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="text-muted">Unable to reach Supabase right now. Please try again shortly.</p>
        </div>
      </main>
    );
  }
}
