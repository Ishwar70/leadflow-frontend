"use client";

import * as RD from "@radix-ui/react-dialog";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Building2, KanbanSquare, Loader2, Search, Target, UsersRound } from "lucide-react";
import { api } from "@/lib/api";
import { useCurrency, useDebounced } from "@/lib/hooks";
import { cn, formatMoney, fullName, labelize } from "@/lib/utils";

interface Results {
  leads: Array<{ _id: string; firstName: string; lastName: string; email: string | null; companyName: string; status: string }>;
  contacts: Array<{ _id: string; firstName: string; lastName: string; email: string | null; jobTitle: string }>;
  companies: Array<{ _id: string; name: string; domain: string; industry: string }>;
  deals: Array<{ _id: string; title: string; value: number; currency: string; status: string }>;
}

export function CommandSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter();
  const currency = useCurrency();
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);
  const dq = useDebounced(q.trim(), 200);
  const { data, isFetching } = useQuery({
    queryKey: ["search", dq],
    queryFn: () => api.get<Results>("/search", { q: dq }),
    enabled: open && dq.length >= 2,
    placeholderData: (prev) => prev,
  });

  const items = useMemo(() => {
    if (!data || dq.length < 2) return [];
    return [
      ...data.leads.map((l) => ({ group: "Leads", icon: Target, href: `/leads/${l._id}`, title: fullName(l), sub: [l.companyName, l.email].filter(Boolean).join(" · "), tag: labelize(l.status) })),
      ...data.contacts.map((c) => ({ group: "Contacts", icon: UsersRound, href: `/contacts/${c._id}`, title: fullName(c), sub: [c.jobTitle, c.email].filter(Boolean).join(" · "), tag: "" })),
      ...data.companies.map((c) => ({ group: "Companies", icon: Building2, href: `/companies/${c._id}`, title: c.name, sub: [c.industry, c.domain].filter(Boolean).join(" · "), tag: "" })),
      ...data.deals.map((d) => ({ group: "Deals", icon: KanbanSquare, href: `/deals/${d._id}`, title: d.title, sub: formatMoney(d.value, d.currency || currency), tag: labelize(d.status) })),
    ];
  }, [data, dq, currency]);

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (!open) setQ("");
  }

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <RD.Root open={open} onOpenChange={onOpenChange}>
      <RD.Portal>
        <RD.Overlay className="fixed inset-0 z-50 bg-ink-950/50 backdrop-blur-[2px] animate-fade-in" />
        <RD.Content className="fixed left-1/2 top-[12vh] z-50 w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border border-line bg-white shadow-pop animate-slide-up">
          <RD.Title className="sr-only">Search</RD.Title>
          <RD.Description className="sr-only">Search leads, contacts, companies and deals</RD.Description>
          <div className="flex items-center gap-3 border-b border-line px-4">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              autoFocus
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setCursor(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setCursor((c) => Math.min(c + 1, items.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setCursor((c) => Math.max(c - 1, 0));
                } else if (e.key === "Enter" && items[cursor]) go(items[cursor].href);
              }}
              placeholder="Search leads, contacts, companies, deals…"
              className="h-14 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
            {isFetching && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
          </div>
          <div className="max-h-[60vh] overflow-y-auto p-2 scrollbar-thin">
            {dq.length < 2 ? (
              <p className="px-3 py-8 text-center text-sm text-slate-400">Type at least 2 characters to search across your workspace.</p>
            ) : items.length === 0 && !isFetching ? (
              <p className="px-3 py-8 text-center text-sm text-slate-500">No results for &ldquo;{dq}&rdquo;.</p>
            ) : (
              items.map((it, i) => (
                <div key={it.href}>
                  {(i === 0 || items[i - 1].group !== it.group) && <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{it.group}</p>}
                  <button
                    onMouseEnter={() => setCursor(i)}
                    onClick={() => go(it.href)}
                    className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left", cursor === i ? "bg-brand-50" : "hover:bg-slate-50")}
                  >
                    <it.icon className={cn("h-4 w-4 shrink-0", cursor === i ? "text-brand-600" : "text-slate-400")} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-800">{it.title}</span>
                      {it.sub && <span className="block truncate text-xs text-slate-500">{it.sub}</span>}
                    </span>
                    {it.tag && <span className="text-[11px] text-slate-400">{it.tag}</span>}
                  </button>
                </div>
              ))
            )}
          </div>
          <div className="flex items-center gap-4 border-t border-line bg-slate-50 px-4 py-2 text-[11px] text-slate-400">
            <span><kbd className="rounded border border-line bg-white px-1">↑↓</kbd> navigate</span>
            <span><kbd className="rounded border border-line bg-white px-1">↵</kbd> open</span>
            <span><kbd className="rounded border border-line bg-white px-1">esc</kbd> close</span>
          </div>
        </RD.Content>
      </RD.Portal>
    </RD.Root>
  );
}
