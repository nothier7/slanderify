import { Suspense } from "react";
import SignInClient from "./signin-client";

function SignInLoading() {
  return (
    <main className="min-h-dvh grid place-items-center p-8">
      <div className="text-muted">Loading sign in...</div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInLoading />}>
      <SignInClient />
    </Suspense>
  );
}
