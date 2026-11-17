"use client";

import * as Popover from "@radix-ui/react-popover";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { api } from "@/lib/api";
import type { Notification } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";

export function Notifications() {
  const qc = useQueryClient();
  const router = useRouter();
  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.get<{ items: Notification[]; unread: number }>("/notifications"),
    refetchInterval: 60_000,
  });
  const readAll = useMutation({
    mutationFn: () => api.post("/notifications/read-all"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const readOne = useMutation({
    mutationFn: (id: string) => api.post(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <Popover.Root>
      <Popover.Trigger className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800" aria-label="Notifications">
        <Bell className="h-[18px] w-[18px]" />
        {!!data?.unread && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
            {data.unread > 9 ? "9+" : data.unread}
          </span>
        )}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="end" sideOffset={8} className="z-50 w-[360px] overflow-hidden rounded-xl border border-line bg-white shadow-pop animate-slide-up">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Notifications</p>
            <button onClick={() => readAll.mutate()} className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50" disabled={!data?.unread}>
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </button>
          </div>
          <div className="max-h-[420px] overflow-y-auto scrollbar-thin">
            {!data?.items.length ? (
              <p className="px-4 py-10 text-center text-sm text-slate-500">You&apos;re all caught up.</p>
            ) : (
              data.items.map((n) => (
                <Popover.Close asChild key={n._id}>
                  <button
                    onClick={() => {
                      if (!n.readAt) readOne.mutate(n._id);
                      if (n.link) router.push(n.link);
                    }}
                    className={cn("flex w-full gap-3 border-b border-line/60 px-4 py-3 text-left transition hover:bg-slate-50", !n.readAt && "bg-brand-50/40")}
                  >
                    <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.readAt ? "bg-transparent" : "bg-brand-500")} />
                    <span className="min-w-0">
                      <span className="block text-sm text-slate-800">{n.title}</span>
                      {n.body && <span className="block truncate text-xs text-slate-500">{n.body}</span>}
                      <span className="mt-0.5 block text-[11px] text-slate-400">{timeAgo(n.createdAt)}</span>
                    </span>
                  </button>
                </Popover.Close>
              ))
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
