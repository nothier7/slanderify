"use client";

import { useSearchParams } from "next/navigation";

export default function NotFoundInner() {
  const params = useSearchParams(); // safe now (inside Suspense)
  const q = params.get("q") ?? "";

  return (
    <main className="min-h-dvh grid place-items-center p-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">404 — Not Found</h1>
        {q ? <p className="mt-2 text-muted">No results for “{q}”.</p> : null}
      </div>
    </main>
  );
}
