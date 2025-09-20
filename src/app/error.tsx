"use client";

import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App route error", error);
  }, [error]);

  return (
    <main className="min-h-dvh grid place-items-center p-8">
      <div className="text-center space-y-3">
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="text-muted max-w-sm mx-auto">
          We could not load this page. Try again and contact support if the issue persists.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
