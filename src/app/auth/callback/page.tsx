import { Suspense } from "react";
import AuthCallbackClient from "./callback-client";

function CallbackLoading() {
  return (
    <main className="min-h-dvh grid place-items-center p-8">
      <div className="text-muted">Finishing sign in...</div>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<CallbackLoading />}>
      <AuthCallbackClient />
    </Suspense>
  );
}
