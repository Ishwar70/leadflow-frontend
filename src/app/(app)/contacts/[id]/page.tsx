"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Mail, Pencil, Phone, Plus } from "lucide-react";
import { DealStatusBadge } from "@/components/app/badges";
import { ContactFormDialog, DealFormDialog } from "@/components/app/forms";
import { RelatedTasks } from "@/components/app/task-list";
import { Timeline } from "@/components/app/timeline";
import { Button } from "@/components/ui/button";
import { Avatar, Card, CardHeader, DetailRow, EmptyState, PageHeader, Skeleton } from "@/components/ui/primitives";
import { api } from "@/lib/api";
import { useCan } from "@/lib/hooks";
import type { Contact } from "@/lib/types";
import { formatDate, formatMoney, fullName } from "@/lib/utils";

type ContactDetail = Contact & { deals: Array<{ _id: string; title: string; value: number; currency: string; status: string }> };

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const can = useCan();
  const [edit, setEdit] = useState(false);
  const [dealOpen, setDealOpen] = useState(false);
  const { data: c, isLoading, error } = useQuery({ queryKey: ["contact", id], queryFn: () => api.get<ContactDetail>(`/contacts/${id}`) });

  if (isLoading) return <Skeleton className="h-96" />;
  if (error || !c)
    return <EmptyState title="Contact not found" description="It may have been removed or you may not have access." action={<Link href="/contacts"><Button variant="secondary">Back to contacts</Button></Link>} />;
  const name = fullName(c);

  return (
    <div>
      <PageHeader
        back={{ href: "/contacts", label: "Contacts" }}
        title={<span className="flex items-center gap-3"><Avatar name={name} size="lg" />{name}</span>}
        description={[c.jobTitle, c.companyId?.name].filter(Boolean).join(" at ")}
        actions={
          <>
            {c.email && <a href={`mailto:${c.email}`}><Button variant="secondary" size="icon" aria-label="Email"><Mail className="h-4 w-4" /></Button></a>}
            {c.phone && <a href={`tel:${c.phone}`}><Button variant="secondary" size="icon" aria-label="Call"><Phone className="h-4 w-4" /></Button></a>}
            {can("records:update") && <Button variant="secondary" onClick={() => setEdit(true)}><Pencil className="h-4 w-4" /> Edit</Button>}
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Details" />
            <dl className="divide-y divide-line/60 px-5 py-2">
              <DetailRow label="Email">{c.email}</DetailRow>
              <DetailRow label="Phone">{c.phone}</DetailRow>
              <DetailRow label="Company">{c.companyId && <Link className="text-brand-600 hover:underline" href={`/companies/${c.companyId._id}`}>{c.companyId.name}</Link>}</DetailRow>
              <DetailRow label="Owner">{c.ownerId?.name}</DetailRow>
              <DetailRow label="Location">{[c.city, c.country].filter(Boolean).join(", ")}</DetailRow>
              <DetailRow label="Added">{formatDate(c.createdAt)}</DetailRow>
            </dl>
          </Card>
          <Card>
            <CardHeader
              title="Deals"
              action={can("records:create") && <Button size="sm" variant="secondary" onClick={() => setDealOpen(true)}><Plus className="h-3.5 w-3.5" /> Deal</Button>}
            />
            {c.deals.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-slate-500">No deals yet.</p>
            ) : (
              <ul className="divide-y divide-line/70">
                {c.deals.map((d) => (
                  <li key={d._id}>
                    <Link href={`/deals/${d._id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-slate-800">{d.title}</span>
                        <span className="text-xs text-slate-500">{formatMoney(d.value, d.currency)}</span>
                      </span>
                      <DealStatusBadge status={d.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <RelatedTasks entityType="contact" entityId={c._id} name={name} />
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Timeline</h2>
          <Timeline entityType="contact" entityId={c._id} />
        </div>
      </div>
      <ContactFormDialog open={edit} onOpenChange={setEdit} contact={c} />
      <DealFormDialog
        open={dealOpen}
        onOpenChange={setDealOpen}
        defaults={{ contact: { id: c._id, label: name }, company: c.companyId ? { id: c.companyId._id, label: c.companyId.name } : undefined }}
      />
    </div>
  );
}
