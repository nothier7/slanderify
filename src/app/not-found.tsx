"use client";

import { Suspense } from "react";
import NotFoundInner from "./not-found-inner";

export default function NotFoundPage() {
  return (
    <Suspense fallback={null}>
      <NotFoundInner />
    </Suspense>
  );
}
