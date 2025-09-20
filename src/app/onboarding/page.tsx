import { Suspense } from "react";
import OnboardingClient from "./onboarding-client";

function LoadingState() {
  return (
    <main className="min-h-dvh grid place-items-center p-8">
      <div className="text-muted">Loading onboarding...</div>
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <OnboardingClient />
    </Suspense>
  );
}
