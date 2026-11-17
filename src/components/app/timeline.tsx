"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowRightLeft,
  CalendarCheck,
  CheckCircle2,
  MessageCircle,
  Mail,
  Phone,
  Repeat,
  Sparkles,
  StickyNote,
  Trash2,
  Trophy,
  UserCheck,
  Users,
  XCircle,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";
import { Card } from "@/components/ui/primitives";
import { api, errorMessage } from "@/lib/api";
import { useCan, useSession } from "@/lib/hooks";
import type { Activity, EntityType } from "@/lib/types";
import { cn, formatDateTime } from "@/lib/utils";

const ICONS: Record<string, { icon: typeof Phone; className: string }> = {
  note: { icon: StickyNote, className: "bg-amber-50 text-amber-600 ring-amber-100" },
  call: { icon: Phone, className: "bg-sky-50 text-sky-600 ring-sky-100" },
  meeting: { icon: Users, className: "bg-violet-50 text-violet-600 ring-violet-100" },
  email: { icon: Mail, className: "bg-brand-50 text-brand-600 ring-brand-100" },
  whatsapp: { icon: MessageCircle, className: "bg-emerald-50 text-emerald-600 ring-emerald-100" },
  created: { icon: Plus, className: "bg-slate-100 text-slate-500 ring-slate-200" },
  status_change: { icon: Repeat, className: "bg-slate-100 text-slate-500 ring-slate-200" },
  assigned: { icon: UserCheck, className: "bg-slate-100 text-slate-500 ring-slate-200" },
  deal_stage: { icon: ArrowRightLeft, className: "bg-brand-50 text-brand-600 ring-brand-100" },
  deal_won: { icon: Trophy, className: "bg-emerald-50 text-emerald-600 ring-emerald-100" },
  deal_lost: { icon: XCircle, className: "bg-rose-50 text-rose-600 ring-rose-100" },
  converted: { icon: Sparkles, className: "bg-violet-50 text-violet-600 ring-violet-100" },
  task_completed: { icon: CheckCircle2, className: "bg-emerald-50 text-emerald-600 ring-emerald-100" },
};

const COMPOSER_TYPES = [
  { value: "note", label: "Note", icon: StickyNote },
  { value: "call", label: "Call", icon: Phone },
  { value: "meeting", label: "Meeting", icon: CalendarCheck },
  { value: "email", label: "Email", icon: Mail },
  { value: "whatsapp", label: "WhatsApp", icon: MessageCircle },
] as const;

export function ActivityItem({ a, onDelete }: { a: Activity; onDelete?: () => void }) {
  const meta = ICONS[a.type] ?? ICONS.created;
  const Icon = meta.icon;
  return (
    <li className="group relative flex gap-3 pb-5 last:pb-0">
      <span className="absolute left-4 top-9 -bottom-0 w-px bg-line group-last:hidden" />
      <span className={cn("relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4", meta.className)}>
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1 pt-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <p className="text-sm font-medium text-slate-800">{a.summary}</p>
          <span className="text-xs text-slate-400">
            {a.actorId?.name ? `${a.actorId.name} · ` : ""}
            {formatDateTime(a.occurredAt)}
          </span>
        </div>
        {a.body && <p className="mt-1.5 whitespace-pre-wrap rounded-lg border border-line bg-slate-50/70 px-3 py-2 text-sm leading-relaxed text-slate-700">{a.body}</p>}
      </div>
      {onDelete && !a.isSystem && (
        <button onClick={onDelete} className="h-7 rounded p-1 text-slate-300 opacity-0 transition hover:text-rose-500 group-hover:opacity-100" aria-label="Delete entry">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </li>
  );
}

export function Timeline({ entityType, entityId }: { entityType: EntityType; entityId: string }) {
  const qc = useQueryClient();
  const can = useCan();
  const { data: session } = useSession();
  const [type, setType] = useState<(typeof COMPOSER_TYPES)[number]["value"]>("note");
  const [body, setBody] = useState("");
  const key = ["activities", entityType, entityId];

  const query = useInfiniteQuery({
    queryKey: key,
    queryFn: ({ pageParam }) => api.list<Activity>("/activities", { entityType, entityId, page: pageParam, limit: 20 }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.page < last.meta.pages ? last.meta.page + 1 : undefined),
  });

  const add = useMutation({
    mutationFn: () => api.post<Activity>("/activities", { type, entityType, entityId, body }),
    onSuccess: () => {
      setBody("");
      toast.success(type === "note" ? "Note added" : "Activity logged");
      qc.invalidateQueries({ queryKey: ["activities"] });
      qc.invalidateQueries({ queryKey: [entityType, entityId] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.del(`/activities/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    onError: (err) => toast.error(errorMessage(err)),
  });

  const items = query.data?.pages.flatMap((p) => p.data) ?? [];
  const canWrite = can("records:update");

  return (
    <div className="space-y-4">
      {canWrite && (
        <Card className="p-3">
          <div className="mb-2 flex flex-wrap gap-1">
            {COMPOSER_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition",
                  type === t.value ? "bg-brand-50 text-brand-700 ring-1 ring-brand-200" : "text-slate-500 hover:bg-slate-100",
                )}
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            ))}
          </div>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={type === "note" ? "Write a note…" : `What happened on this ${type === "whatsapp" ? "WhatsApp chat" : type}?`}
            rows={3}
            className="border-0 px-1 shadow-none focus:ring-0"
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && body.trim()) add.mutate();
            }}
          />
          <div className="flex items-center justify-between border-t border-line pt-2">
            <span className="text-[11px] text-slate-400">Ctrl + Enter to save</span>
            <Button size="sm" onClick={() => add.mutate()} loading={add.isPending} disabled={type === "note" && !body.trim()}>
              {type === "note" ? "Add note" : `Log ${COMPOSER_TYPES.find((t) => t.value === type)?.label.toLowerCase()}`}
            </Button>
          </div>
        </Card>
      )}

      <Card className="p-5">
        {query.isLoading ? (
          <p className="text-sm text-slate-400">Loading timeline…</p>
        ) : items.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">No activity yet. Log a call or add a note to start the timeline.</p>
        ) : (
          <ul>
            {items.map((a) => (
              <ActivityItem
                key={a._id}
                a={a}
                onDelete={a.actorId?._id === session?.user.id || can("workspace:manage") ? () => remove.mutate(a._id) : undefined}
              />
            ))}
          </ul>
        )}
        {query.hasNextPage && (
          <Button variant="ghost" size="sm" className="mt-4 w-full" onClick={() => query.fetchNextPage()} loading={query.isFetchingNextPage}>
            Load older activity
          </Button>
        )}
      </Card>
    </div>
  );
}
