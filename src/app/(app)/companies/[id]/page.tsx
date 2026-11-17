"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Globe, Pencil, Plus } from "lucide-react";
import { DealStatusBadge } from "@/components/app/badges";
import { CompanyFormDialog, ContactFormDialog, DealFormDialog } from "@/components/app/forms";
import { RelatedTasks } from "@/components/app/task-list";
import { Timeline } from "@/components/app/timeline";
import { Button } from "@/components/ui/button";
import { Avatar, Card, CardHeader, DetailRow, EmptyState, PageHeader, Skeleton, Tabs } from "@/components/ui/primitives";
import { api } from "@/lib/api";
import { useCan, useCurrency } from "@/lib/hooks";
import type { Company } from "@/lib/types";
import { formatDate, formatMoney, fullName } from "@/lib/utils";

type CompanyDetail = Company & {
  contacts: Array<{ _id: string; firstName: string; lastName: string; email: string | null; phone: string | null; jobTitle: string }>;
  deals: Array<{ _id: string; title: string; value: number; currency: string; status: string; expectedCloseDate: string | null }>;
};

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const can = useCan();
  const currency = useCurrency();
  const [tab, setTab] = useState<"timeline" | "contacts" | "deals">("timeline");
  const [edit, setEdit] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [dealOpen, setDealOpen] = useState(false);
  const { data: c, isLoading, error } = useQuery({ queryKey: ["company", id], queryFn: () => api.get<CompanyDetail>(`/companies/${id}`) });

  if (isLoading) return <Skeleton className="h-96" />;
  if (error || !c)
    return <EmptyState title="Company not found" description="It may have been removed or you may not have access." action={<Link href="/companies"><Button variant="secondary">Back to companies</Button></Link>} />;

  const openValue = c.deals.filter((d) => d.status === "open").reduce((s, d) => s + d.value, 0);
  const wonValue = c.deals.filter((d) => d.status === "won").reduce((s, d) => s + d.value, 0);

  return (
    <div>
      <PageHeader
        back={{ href: "/companies", label: "Companies" }}
        title={
          <span className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 text-base font-bold text-white">{c.name[0]}</span>
            {c.name}
          </span>
        }
        description={[c.industry, c.size && `${c.size} employees`].filter(Boolean).join(" · ")}
        actions={
          <>
            {can("records:create") && <Button variant="secondary" onClick={() => setContactOpen(true)}><Plus className="h-4 w-4" /> Contact</Button>}
            {can("records:create") && <Button variant="secondary" onClick={() => setDealOpen(true)}><Plus className="h-4 w-4" /> Deal</Button>}
            {can("records:update") && <Button variant="secondary" onClick={() => setEdit(true)}><Pencil className="h-4 w-4" /> Edit</Button>}
          </>
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card className="p-4"><p className="text-xs text-slate-500">Contacts</p><p className="mt-1 text-xl font-semibold">{c.contacts.length}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Open pipeline</p><p className="mt-1 text-xl font-semibold">{formatMoney(openValue, currency)}</p></Card>
        <Card className="p-4"><p className="text-xs text-slate-500">Won value</p><p className="mt-1 text-xl font-semibold text-emerald-600">{formatMoney(wonValue, currency)}</p></Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Details" />
            <dl className="divide-y divide-line/60 px-5 py-2">
              <DetailRow label="Website">{c.domain && <a className="inline-flex items-center gap-1 text-brand-600 hover:underline" href={`https://${c.domain}`} target="_blank" rel="noreferrer"><Globe className="h-3.5 w-3.5" />{c.domain}</a>}</DetailRow>
              <DetailRow label="Phone">{c.phone}</DetailRow>
              <DetailRow label="Address">{[c.address, c.city, c.country].filter(Boolean).join(", ")}</DetailRow>
              <DetailRow label="Owner">{c.ownerId?.name}</DetailRow>
              <DetailRow label="Added">{formatDate(c.createdAt)}</DetailRow>
            </dl>
          </Card>
          <RelatedTasks entityType="company" entityId={c._id} name={c.name} />
        </div>
        <div>
          <Tabs
            className="mb-4"
            value={tab}
            onChange={setTab}
            items={[
              { value: "timeline", label: "Timeline" },
              { value: "contacts", label: "Contacts", count: c.contacts.length },
              { value: "deals", label: "Deals", count: c.deals.length },
            ]}
          />
          {tab === "timeline" && <Timeline entityType="company" entityId={c._id} />}
          {tab === "contacts" && (
            <Card>
              {c.contacts.length === 0 ? (
                <EmptyState title="No contacts" description="Add the people you work with at this company." />
              ) : (
                <ul className="divide-y divide-line/70">
                  {c.contacts.map((p) => (
                    <li key={p._id}>
                      <Link href={`/contacts/${p._id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                        <Avatar name={fullName(p)} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium text-slate-800">{fullName(p)}</span>
                          <span className="block text-xs text-slate-500">{[p.jobTitle, p.email].filter(Boolean).join(" · ")}</span>
                        </span>
                        <span className="text-xs text-slate-500">{p.phone}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
          {tab === "deals" && (
            <Card>
              {c.deals.length === 0 ? (
                <EmptyState title="No deals" description="Create a deal to start tracking revenue for this company." />
              ) : (
                <ul className="divide-y divide-line/70">
                  {c.deals.map((d) => (
                    <li key={d._id}>
                      <Link href={`/deals/${d._id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50">
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-slate-800">{d.title}</span>
                          <span className="text-xs text-slate-500">{formatMoney(d.value, d.currency)} · Close {formatDate(d.expectedCloseDate)}</span>
                        </span>
                        <DealStatusBadge status={d.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </div>
      </div>
      <CompanyFormDialog open={edit} onOpenChange={setEdit} company={c} />
      <ContactFormDialog open={contactOpen} onOpenChange={setContactOpen} defaultCompany={{ id: c._id, label: c.name }} />
      <DealFormDialog open={dealOpen} onOpenChange={setDealOpen} defaults={{ company: { id: c._id, label: c.name } }} />
    </div>
  );
}
