export default function Hero() {
  return (
    <main className="min-h-dvh grid place-items-center p-8">
      <div className="max-w-3xl text-center space-y-6">
        <div className="inline-block rounded-full border border-border/20 px-3 py-1 text-sm text-muted">Football banter, organized.</div>
        <h1 className="text-4xl md:text-5xl font-bold leading-tight">
          Slanderify: submit ruthless nicknames and vote the best to the top
        </h1>
        <p className="text-muted text-lg">
          Pick a player, coin your sharpest slander name, and upvote the ones that sting. Weekly, monthly and yearly leaderboards keep score.
        </p>
        <div className="flex items-center justify-center gap-3">
          <a href="/signin" className="h-11 px-6 rounded-lg bg-primary-500 text-bg font-medium">Sign in to get started</a>
          <a href="#how" className="h-11 px-6 rounded-lg border border-border/20">Learn how it works</a>
        </div>
        <div id="how" className="mt-8 grid gap-4 md:grid-cols-3 text-left">
          <div className="card p-4">
            <div className="font-medium mb-1">1) Submit</div>
            <div className="text-muted text-sm">Pick the player, choose the league, and add your slander name.</div>
          </div>
          <div className="card p-4">
            <div className="font-medium mb-1">2) Vote</div>
            <div className="text-muted text-sm">Upvote or downvote names. The best rise, the rest fade.</div>
          </div>
          <div className="card p-4">
            <div className="font-medium mb-1">3) Climb</div>
            <div className="text-muted text-sm">See weekly, monthly, and yearly leaders across leagues.</div>
          </div>
        </div>
      </div>
    </main>
  );
}

