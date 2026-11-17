"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { api } from "./api";
import type { Member, Permission, Pipeline, Session } from "./types";

export function useSession() {
  return useQuery({ queryKey: ["session"], queryFn: () => api.get<Session>("/auth/me"), staleTime: 60_000 });
}

export function useCan() {
  const { data } = useSession();
  return (p: Permission) => Boolean(data?.permissions.includes(p));
}

export function useMembers() {
  return useQuery({ queryKey: ["members"], queryFn: () => api.get<Member[]>("/members"), staleTime: 120_000 });
}

export function usePipelines() {
  return useQuery({ queryKey: ["pipelines"], queryFn: () => api.get<Pipeline[]>("/pipelines"), staleTime: 120_000 });
}

export function useCurrency() {
  const { data } = useSession();
  return data?.activeWorkspace?.currency ?? "INR";
}

export function useDebounced<T>(value: T, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

/** Page number that resets to 1 whenever `filterKey` changes. */
export function useResettingPage(filterKey: string) {
  const [state, setState] = useState({ key: filterKey, page: 1 });
  const page = state.key === filterKey ? state.page : 1;
  const setPage = useCallback((p: number) => setState({ key: filterKey, page: p }), [filterKey]);
  return [page, setPage] as const;
}

const noopSubscribe = () => () => {};

/** Browser-only value (e.g. location) that renders `fallback` on the server without hydration mismatches. */
export function useBrowserValue<T>(read: () => T, fallback: T) {
  return useSyncExternalStore(noopSubscribe, read, () => fallback);
}

/** Reads a URL query param once on mount (avoids useSearchParams Suspense requirements). */
export function useInitialParam(name: string, apply: (value: string) => void) {
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get(name);
    if (v) apply(v);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);
}

export function useLogout() {
  const qc = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: () => api.post("/auth/logout"),
    onSettled: () => {
      qc.clear();
      router.replace("/login");
    },
  });
}

export function useSwitchWorkspace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Session>(`/workspaces/${id}/switch`),
    onSuccess: (session) => {
      qc.clear();
      qc.setQueryData(["session"], session);
      window.location.href = "/dashboard";
    },
  });
}
