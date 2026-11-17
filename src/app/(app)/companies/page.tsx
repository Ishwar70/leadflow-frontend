"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Building2, Plus, Search } from "lucide-react";
import { CompanyFormDialog } from "@/components/app/forms";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { Card, EmptyState, PageHeader, Pagination, Skeleton, Table, Td, Th } from "@/components/ui/primitives";
import { api } from "@/lib/api";
import { INDUSTRIES } from "@/lib/constants";
import { useCan, useCurrency, useDebounced, useResettingPage } from "@/lib/hooks";
import type { Company } from "@/lib/types";
import { cn, formatMoney } from "@/lib/utils";

export default function CompaniesPage() {
  const router = useRouter();
  const can = useCan();
  const currency = useCurrency();
  const [q, setQ] = useState("");
  const [industry, setIndustry] = useState("");
  const [open, setOpen] = useState(false);
  const dq = useDebounced(q);
  const [page, setPage] = useResettingPage(`${dq}|${industry}`);
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["companies", dq, industry, page],
    queryFn: () => api.list<Company>("/companies", { q: dq, industry, page, limit: 25 }),
    placeholderData: keepPreviousData,
  });
  const items = data?.data ?? [];

  return (
    <div>
      <PageHeader
        title="Companies"
        description="Accounts with their contacts, deals and full relationship history."
        actions={can("records:create") && <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New company</Button>}
      />
      <Card>
        <div className="flex flex-wrap gap-2 border-b border-line p-3">
          <div className="relative min-w-56 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search companies" className="pl-9" />
          </div>
          <Select value={industry} onChange={(e) => setIndustry(e.target.value)} className="w-44">
            <option value="">All industries</option>
            {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
          </Select>
        </div>
        {isLoading ? (
          <div className="space-y-2 p-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Building2 className="h-5 w-5" />}
            title={dq || industry ? "No companies match" : "No companies yet"}
            description={dq || industry ? "Try a different search or industry." : "Companies are created when leads convert, or add one directly."}
            action={!dq && !industry && can("records:create") && <Button onClick={() => setOpen(true)}>Add company</Button>}
          />
        ) : (
          <div className={cn(isFetching && "opacity-60")}>
            <Table>
              <thead>
                <tr><Th>Company</Th><Th>Industry</Th><Th>Location</Th><Th className="text-right">Contacts</Th><Th className="text-right">Deals</Th><Th className="text-right">Open value</Th><Th>Owner</Th></tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c._id} className="cursor-pointer hover:bg-slate-50/80" onClick={() => router.push(`/companies/${c._id}`)}>
                    <Td>
                      <span className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 text-xs font-bold text-slate-600">{c.name[0]}</span>
                        <span>
                          <span className="block font-medium text-slate-900">{c.name}</span>
                          <span className="block text-xs text-slate-500">{c.domain}</span>
                        </span>
                      </span>
                    </Td>
                    <Td className="text-slate-600">{c.industry || "—"}</Td>
                    <Td className="text-slate-600">{[c.city, c.country].filter(Boolean).join(", ") || "—"}</Td>
                    <Td className="text-right">{c.contactCount}</Td>
                    <Td className="text-right">{c.dealCount}</Td>
                    <Td className="text-right font-medium text-slate-900">{formatMoney(c.openDealValue ?? 0, currency)}</Td>
                    <Td className="text-slate-600">{c.ownerId?.name}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            {data && <Pagination page={data.meta.page} pages={data.meta.pages} total={data.meta.total} onChange={setPage} label="companies" />}
          </div>
        )}
      </Card>
      <CompanyFormDialog open={open} onOpenChange={setOpen} onSaved={(c) => router.push(`/companies/${c._id}`)} />
    </div>
  );
}
