"use client";

import * as Popover from "@radix-ui/react-popover";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { Select } from "@/components/ui/form";
import { api } from "@/lib/api";
import { useDebounced, useMembers, useSession } from "@/lib/hooks";
import { cn } from "@/lib/utils";

export function MemberSelect({
  value,
  onChange,
  includeAll,
  allLabel = "All owners",
  disabled,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  includeAll?: boolean;
  allLabel?: string;
  disabled?: boolean;
  className?: string;
}) {
  const { data: members } = useMembers();
  const { data: session } = useSession();
  const canAssign = session?.permissions.includes("records:assign");
  const list = (members ?? []).filter((m) => m.status === "active" && m.role !== "viewer");
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled || (!canAssign && !includeAll)} className={className}>
      {includeAll && <option value="">{allLabel}</option>}
      {!includeAll && !value && <option value="">Me</option>}
      {list.map((m) => (
        <option key={m.userId} value={m.userId}>
          {m.name}
          {m.userId === session?.user.id ? " (you)" : ""}
        </option>
      ))}
    </Select>
  );
}

interface Option {
  id: string;
  label: string;
  sub?: string;
}

/** Async searchable picker for companies or contacts. */
export function EntityPicker({
  kind,
  value,
  onChange,
  placeholder,
  filter,
}: {
  kind: "companies" | "contacts";
  value: Option | null;
  onChange: (o: Option | null) => void;
  placeholder?: string;
  filter?: Record<string, string>;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const dq = useDebounced(q, 200);
  const { data, isFetching } = useQuery({
    queryKey: ["picker", kind, dq, filter],
    queryFn: async () => {
      const res = await api.list<Record<string, unknown>>(`/${kind}`, { q: dq, limit: 20, ...filter });
      return res.data.map<Option>((r) =>
        kind === "companies"
          ? { id: String(r._id), label: String(r.name), sub: String(r.industry ?? "") }
          : { id: String(r._id), label: `${r.firstName} ${r.lastName ?? ""}`.trim(), sub: String(r.email ?? "") },
      );
    },
    enabled: open,
  });

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <div className="relative">
        <Popover.Trigger
          type="button"
          className="flex h-9 w-full items-center justify-between rounded-lg border border-line bg-white px-3 text-left text-sm shadow-[0_1px_2px_rgb(16_24_40/0.04)] focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100"
        >
          <span className={cn("truncate", !value && "text-slate-400")}>{value?.label ?? placeholder ?? "Select…"}</span>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </Popover.Trigger>
        {value && (
          <button type="button" onClick={() => onChange(null)} className="absolute right-8 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-700" aria-label="Clear">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <Popover.Portal>
        <Popover.Content align="start" sideOffset={4} className="z-[60] w-[var(--radix-popover-trigger-width)] rounded-xl border border-line bg-white p-1.5 shadow-pop animate-slide-up">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Search ${kind}…`}
            className="mb-1 h-8 w-full rounded-md border border-line px-2.5 text-sm outline-none focus:border-brand-400"
          />
          <div className="max-h-56 overflow-y-auto scrollbar-thin">
            {isFetching && !data ? (
              <p className="px-2 py-3 text-xs text-slate-400">Loading…</p>
            ) : !data?.length ? (
              <p className="px-2 py-3 text-xs text-slate-400">No matches</p>
            ) : (
              data.map((o) => (
                <button
                  type="button"
                  key={o.id}
                  onClick={() => {
                    onChange(o);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-slate-50"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-slate-800">{o.label}</span>
                    {o.sub && <span className="block truncate text-xs text-slate-400">{o.sub}</span>}
                  </span>
                  {value?.id === o.id && <Check className="h-4 w-4 text-brand-600" />}
                </button>
              ))
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
