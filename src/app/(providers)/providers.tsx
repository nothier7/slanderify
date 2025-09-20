"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, Suspense, useState } from "react";
import AuthExchange from "@/components/AuthExchange";

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={null}>
        <AuthExchange />
      </Suspense>
      {children}
    </QueryClientProvider>
  );
}
