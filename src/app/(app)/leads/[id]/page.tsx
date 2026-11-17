"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Archive, ArchiveRestore, ArrowRightLeft, Building2, KanbanSquare, Mail, Pencil, Phone, Sparkles, UserRound } from "lucide-react";
import { LeadStatusBadge, SourceLabel } from "@/components/app/badges";
import { LeadFormDialog } from "@/components/app/forms";
import { RelatedTasks } from "@/components/app/task-list";
import { Timeline } from "@/components/app/timeline";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { Checkbox, Field, Input, Select } from "@/components/ui/form";
import { Avatar, Badge, Card, CardHeader, DetailRow, EmptyState, PageHeader, Skeleton } from "@/components/ui/primitives";
import { api, ApiError, errorMessage } from "@/lib/api";
import { LEAD_STATUSES } from "@/lib/constants";
import { useCan, usePipelines } from "@/lib/hooks";
import type { Lead } from "@/lib/types";
import { cn, formatDate, formatDateTime, formatMoney, fullName } from "@/lib/utils";

function ConvertDialog({ lead, open, onOpenChange }: { lead: Lead; open: boolean; onOpenChange: (o: boolean) => void }) {
  const qc = useQueryClient();
  const router = useRouter();
  const { data: pipelines } = usePipelines();
  const [createCompany, setCreateCompany] = useState(Boolean(lead.companyName));
  const [companyName, setCompanyName] = useState(lead.companyName);
  const [createDeal, setCreateDeal] = useState(true);
  const [dealTitle, setDealTitle] = useState(`${lead.companyName || fullName(lead)} - Opportunity`);
  const [dealValue, setDealValue] = useState(String(lead.estimatedValue || ""));
  const [pipelineId, setPipelineId] = useState("");
  const [closeDate, setCloseDate] = useState("");

  const convert = useMutation({
    mutationFn: () =>
      api.post<{ contactId: string; companyId: string | null; dealId: string | null }>(`/leads/${lead._id}/convert`, {
        createCompany: createCompany && Boolean(companyName.trim()),
        companyName,
        createDeal,
        dealTitle,
        dealValue: Number(dealValue || 0),
        pipelineId: pipelineId || undefined,
        expectedCloseDate: closeDate ? new Date(`${closeDate}T12:00:00`).toISOString() : null,
      }),
    onSuccess: (r) => {
      toast.success("Lead converted successfully");
      qc.invalidateQueries();
      onOpenChange(false);
      router.push(r.dealId ? `/deals/${r.dealId}` : `/contacts/${r.contactId}`);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Convert lead"
      description="Creates a contact, and optionally a company and deal, in a single atomic step. Timeline history carries over."
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => convert.mutate()} loading={convert.isPending}>
            <Sparkles className="h-4 w-4" /> Convert
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-xl border border-line p-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-600"><UserRound className="h-4 w-4" /></span>
          <div className="text-sm">
            <p className="font-medium text-slate-900">Contact: {fullName(lead)}</p>
            <p className="text-xs text-slate-500">Always created</p>
          </div>
        </div>
        <div className="rounded-xl border border-line p-3">
          <label className="flex items-center gap-3">
            <Checkbox checked={createCompany} onChange={(e) => setCreateCompany(e.target.checked)} />
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600"><Building2 className="h-4 w-4" /></span>
            <span className="text-sm font-medium text-slate-900">Create or link company</span>
          </label>
          {createCompany && (
            <Field className="mt-3" hint="Links to an existing company with the same name if one exists">
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Company name" />
            </Field>
          )}
        </div>
        <div className="rounded-xl border border-line p-3">
          <label className="flex items-center gap-3">
            <Checkbox checked={createDeal} onChange={(e) => setCreateDeal(e.target.checked)} />
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><KanbanSquare className="h-4 w-4" /></span>
            <span className="text-sm font-medium text-slate-900">Create deal</span>
          </label>
          {createDeal && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Deal title" className="sm:col-span-2">
                <Input value={dealTitle} onChange={(e) => setDealTitle(e.target.value)} />
              </Field>
              <Field label="Value">
                <Input type="number" min={0} value={dealValue} onChange={(e) => setDealValue(e.target.value)} />
              </Field>
              <Field label="Expected close">
                <Input type="date" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} />
              </Field>
              <Field label="Pipeline" className="sm:col-span-2">
                <Select value={pipelineId} onChange={(e) => setPipelineId(e.target.value)}>
                  {pipelines?.map((p) => (
                    <option key={p._id} value={p.isDefault ? "" : p._id}>{p.name}{p.isDefault ? " (default)" : ""}</option>
                  ))}
                </Select>
              </Field>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const can = useCan();
  const [editOpen, setEditOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const { data: lead, isLoading, error } = useQuery({ queryKey: ["lead", id], queryFn: () => api.get<Lead>(`/leads/${id}`) });

  const setStatus = useMutation({
    mutationFn: (status: string) => api.patch<Lead>(`/leads/${id}`, { status }),
    onSuccess: (l) => {
      qc.setQueryData(["lead", id], l);
      qc.invalidateQueries({ queryKey: ["activities", "lead", id] });
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
  const archive = useMutation({
    mutationFn: () => api.post<Lead>(`/leads/${id}/${lead?.archivedAt ? "restore" : "archive"}`),
    onSuccess: () => {
      toast.success(lead?.archivedAt ? "Lead restored" : "Lead archived");
      setArchiveOpen(false);
      qc.invalidateQueries({ queryKey: ["lead", id] });
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  if (isLoading) return <Skeleton className="h-96" />;
  if (error || !lead)
    return (
      <EmptyState
        title={error instanceof ApiError && error.status === 404 ? "Lead not found" : "Could not load lead"}
        description="It may have been removed, or you may not have access to it."
        action={<Link href="/leads"><Button variant="secondary">Back to leads</Button></Link>}
      />
    );

  const name = fullName(lead);
  const converted = lead.status === "converted";

  return (
    <div>
      <PageHeader
        back={{ href: "/leads", label: "Leads" }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            <Avatar name={name} size="lg" />
            <span>{name}</span>
            <LeadStatusBadge status={lead.status} />
            {lead.archivedAt && <Badge tone="slate">Archived</Badge>}
          </span>
        }
        description={[lead.jobTitle, lead.companyName].filter(Boolean).join(" at ")}
        actions={
          <>
            {lead.email && (
              <a href={`mailto:${lead.email}`}>
                <Button variant="secondary" size="icon" aria-label="Email"><Mail className="h-4 w-4" /></Button>
              </a>
            )}
            {lead.phone && (
              <a href={`tel:${lead.phone}`}>
                <Button variant="secondary" size="icon" aria-label="Call"><Phone className="h-4 w-4" /></Button>
              </a>
            )}
            {can("records:archive") && (
              <Button variant="secondary" onClick={() => setArchiveOpen(true)}>
                {lead.archivedAt ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                {lead.archivedAt ? "Restore" : "Archive"}
              </Button>
            )}
            {can("records:update") && (
              <Button variant="secondary" onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4" /> Edit
              </Button>
            )}
            {can("records:update") && !converted && !lead.archivedAt && (
              <Button onClick={() => setConvertOpen(true)}>
                <ArrowRightLeft className="h-4 w-4" /> Convert
              </Button>
            )}
          </>
        }
      />

      {converted && (
        <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-violet-200 bg-violet-50/70 px-4 py-3 text-sm">
          <Sparkles className="h-4 w-4 text-violet-600" />
          <span className="font-medium text-violet-900">Converted {formatDate(lead.convertedAt)}</span>
          {lead.convertedContactId && <Link className="text-violet-700 underline-offset-2 hover:underline" href={`/contacts/${lead.convertedContactId}`}>View contact</Link>}
          {lead.convertedCompanyId && <Link className="text-violet-700 underline-offset-2 hover:underline" href={`/companies/${lead.convertedCompanyId}`}>View company</Link>}
          {lead.convertedDealId && <Link className="text-violet-700 underline-offset-2 hover:underline" href={`/deals/${lead.convertedDealId}`}>View deal</Link>}
        </div>
      )}

      {can("records:update") && !converted && !lead.archivedAt && (
        <div className="mb-6 flex flex-wrap gap-1.5">
          {LEAD_STATUSES.filter((s) => s.value !== "converted").map((s) => (
            <button
              key={s.value}
              disabled={setStatus.isPending}
              onClick={() => s.value !== lead.status && setStatus.mutate(s.value)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition",
                lead.status === s.value ? "border-brand-300 bg-brand-600 text-white shadow-sm" : "border-line bg-white text-slate-600 hover:border-brand-200 hover:text-brand-700",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Details" />
            <dl className="divide-y divide-line/60 px-5 py-2">
              <DetailRow label="Email">{lead.email && <a className="text-brand-600 hover:underline" href={`mailto:${lead.email}`}>{lead.email}</a>}</DetailRow>
              <DetailRow label="Phone">{lead.phone}</DetailRow>
              <DetailRow label="Company">{lead.companyName}</DetailRow>
              <DetailRow label="Source"><SourceLabel source={lead.source} /></DetailRow>
              <DetailRow label="Value"><span className="font-medium">{formatMoney(lead.estimatedValue, lead.currency)}</span></DetailRow>
              <DetailRow label="Owner">
                <span className="flex items-center gap-2"><Avatar name={lead.ownerId?.name ?? "?"} size="xs" />{lead.ownerId?.name}</span>
              </DetailRow>
              <DetailRow label="Location">{[lead.city, lead.country].filter(Boolean).join(", ")}</DetailRow>
              <DetailRow label="Next follow-up">{lead.nextFollowUpAt ? formatDate(lead.nextFollowUpAt) : null}</DetailRow>
              <DetailRow label="Last contacted">{lead.lastContactedAt ? formatDateTime(lead.lastContactedAt) : null}</DetailRow>
              <DetailRow label="Tags">
                {lead.tags.length ? (
                  <span className="flex flex-wrap gap-1">{lead.tags.map((t) => <Badge key={t} tone="brand">{t}</Badge>)}</span>
                ) : null}
              </DetailRow>
              <DetailRow label="Created">{formatDate(lead.createdAt)}</DetailRow>
            </dl>
          </Card>
          <RelatedTasks entityType="lead" entityId={lead._id} name={name} />
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Timeline</h2>
          <Timeline entityType="lead" entityId={lead._id} />
        </div>
      </div>

      <LeadFormDialog open={editOpen} onOpenChange={setEditOpen} lead={lead} />
      {convertOpen && <ConvertDialog lead={lead} open onOpenChange={setConvertOpen} />}
      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title={lead.archivedAt ? "Restore lead?" : "Archive lead?"}
        description={lead.archivedAt ? "The lead will appear in lists and search again." : "Archived leads are hidden from lists, search and reports. You can restore them at any time."}
        confirmLabel={lead.archivedAt ? "Restore" : "Archive"}
        tone={lead.archivedAt ? "primary" : "danger"}
        onConfirm={() => archive.mutate()}
        loading={archive.isPending}
      />
    </div>
  );
}
