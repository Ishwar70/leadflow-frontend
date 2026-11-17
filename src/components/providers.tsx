"use client";

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import { ApiError } from "@/lib/api";

function handleAuthError(err: unknown) {
  if (err instanceof ApiError && err.status === 401 && typeof window !== "undefined") {
    const path = window.location.pathname;
    if (!["/login", "/register", "/"].includes(path) && !path.startsWith("/invite")) {
      window.location.href = `/login?next=${encodeURIComponent(path)}`;
    }
  }
}

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({ onError: handleAuthError }),
        mutationCache: new MutationCache({ onError: handleAuthError }),
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: (count, err) => !(err instanceof ApiError && err.status < 500) && count < 2,
          },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster position="bottom-right" richColors closeButton toastOptions={{ className: "font-sans" }} />
    </QueryClientProvider>
  );
}
