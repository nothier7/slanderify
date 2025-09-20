import { cn } from "@/lib/cn";
import { buttonVariants } from "@/components/ui/button-variants";

export default function LandingPage() {
  return (
    <main>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(1200px_circle_at_50%_-20%,oklch(0.3_0.06_275/.35),transparent_60%)]" />
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-28">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div className="space-y-6">
              <div className="inline-block rounded-full border border-border/20 px-3 py-1 text-sm text-muted">Football banter, organized</div>
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                Coin ruthless nicknames.<br />Vote the best to the top.
              </h1>
              <p className="text-muted/90 text-lg max-w-xl">
                Slanderify lets you submit the sharpest slander names for players across top leagues, then upvote the crowd’s favorites. Weekly, monthly, and yearly leaderboards keep score.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <a href="/signin" className={cn(buttonVariants({ size: "lg" }))}>Sign in to get started</a>
                <a href="#how" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>How it works</a>
              </div>
            </div>
            <div className="relative">
              <div className="card p-4 md:p-6 rotate-1">
                <div className="text-sm text-muted">Preview</div>
                <div className="mt-2 space-y-3">
                  <div className="card p-3">
                    <div className="text-sm text-muted">Kylian Mbappé · Ligue1</div>
                    <div className="text-lg font-medium">KYew-lion M’bapp’d</div>
                  </div>
                  <div className="card p-3">
                    <div className="text-sm text-muted">Erling Haaland · EPL</div>
                    <div className="text-lg font-medium">Tap-in Terminator</div>
                  </div>
                  <div className="card p-3">
                    <div className="text-sm text-muted">Jude Bellingham · LaLiga</div>
                    <div className="text-lg font-medium">Belli-hype</div>
                  </div>
                </div>
              </div>
              <div className="absolute -inset-1 -z-10 rounded-xl bg-gradient-to-br from-primary-500/20 to-transparent blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-4 md:grid-cols-3">
          <Feature title="Submit" desc="Pick a player, choose the league, and add your slander name. Simple and fast." />
          <Feature title="Vote" desc="Upvote the best, downvote the rest. The crowd decides what sticks." />
          <Feature title="Climb" desc="Leaderboards by week, month, and year across the top leagues." />
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-2xl md:text-3xl font-bold">How it works</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Step n={1} title="Sign in" desc="Use your email to get a magic link and join the banter." />
          <Step n={2} title="Submit names" desc="Add slander names for any player in EPL, LaLiga, Serie A, Bundesliga, or Ligue 1." />
          <Step n={3} title="Vote + share" desc="Vote the best ones up and share your favorites with friends." />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="card p-6 md:p-10">
          <blockquote className="text-xl md:text-2xl leading-relaxed">
            “It’s like the group chat’s finest banter—finally scoreboarded. Submitting and voting is addictive.”
          </blockquote>
          <div className="mt-3 text-muted">— A very opinionated football fan</div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-2xl md:text-3xl font-bold">FAQ</h2>
        <div className="mt-6 space-y-3">
          <Faq q="Do I need an account?" a="Yes. Sign in with your email to submit or vote. The landing page is public so you can learn what it's about." />
          <Faq q="Are there content rules?" a="We block disallowed phrases and reserve moderation rights. Keep it football-focused and fun." />
          <Faq q="Which leagues are supported?" a="EPL, LaLiga, Serie A, Bundesliga, and Ligue 1." />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="card p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-2xl font-bold">Ready to sling some slander?</div>
            <div className="text-muted">Sign in to submit names and vote the best ones up.</div>
          </div>
          <a href="/signin" className={cn(buttonVariants({ size: "lg" }))}>Sign in</a>
        </div>
      </section>
    </main>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="card p-5">
      <div className="text-lg font-semibold">{title}</div>
      <div className="text-muted mt-1">{desc}</div>
    </div>
  );
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="relative card p-5">
      <div className="absolute -top-3 -left-3 h-8 w-8 grid place-items-center rounded-full bg-primary-500 text-bg font-semibold">{n}</div>
      <div className="text-lg font-semibold">{title}</div>
      <div className="text-muted mt-1">{desc}</div>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="card">
      <summary className="cursor-pointer list-none p-5 text-lg font-medium">{q}</summary>
      <div className="px-5 pb-5 text-muted">{a}</div>
    </details>
  );
}
