import { createSupabaseServer } from "@/lib/supabase/server";
import LeaderboardView from "@/components/LeaderboardView";
import LandingPage from "@/components/LandingPage";

export default async function Home() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return <LandingPage />;

  return (
    <main className="min-h-dvh p-6">
      <LeaderboardView />
    </main>
  );
}
