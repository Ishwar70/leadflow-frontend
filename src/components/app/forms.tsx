"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm, type FieldValues, type Path, type UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { api, ApiError, errorMessage } from "@/lib/api";
import { COMPANY_SIZES, INDUSTRIES, LEAD_SOURCES, LEAD_STATUSES, PRIORITIES, TASK_TYPES } from "@/lib/constants";
import { useCurrency, usePipelines, useSession } from "@/lib/hooks";
import type { Company, Contact, Deal, EntityType, Lead, Task } from "@/lib/types";
import { fullName, toInputDate, toInputDateTime } from "@/lib/utils";
import { EntityPicker, MemberSelect } from "./pickers";

function applyServerErrors<T extends FieldValues>(form: UseFormReturn<T>, err: unknown) {
  if (err instanceof ApiError && err.fieldErrors) {
    let applied = false;
    for (const [k, msg] of Object.entries(err.fieldErrors)) {
      form.setError(k as Path<T>, { message: msg });
      applied = true;
    }
    if (applied && err.code !== "DUPLICATE_LEAD") return;
  }
  if (!(err instanceof ApiError && err.code === "DUPLICATE_LEAD")) toast.error(errorMessage(err));
}

const nullIfEmpty = (v: string | undefined | null) => (v && v.trim() ? v.trim() : null);

// ---------------- Lead ----------------

interface LeadValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  jobTitle: string;
  source: string;
  status: string;
  ownerId: string;
  estimatedValue: string;
  city: string;
  country: string;
  tags: string;
  nextFollowUpAt: string;
}

export function LeadFormDialog({ open, onOpenChange, lead, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; lead?: Lead; onSaved?: (l: Lead) => void }) {
  const qc = useQueryClient();
  const { data: session } = useSession();
  const currency = useCurrency();
  const [duplicates, setDuplicates] = useState<Array<{ _id: string; firstName: string; lastName: string; email: string; phone: string }> | null>(null);
  const defaults = (): LeadValues => ({
    firstName: lead?.firstName ?? "",
    lastName: lead?.lastName ?? "",
    email: lead?.email ?? "",
    phone: lead?.phone ?? "",
    companyName: lead?.companyName ?? "",
    jobTitle: lead?.jobTitle ?? "",
    source: lead?.source ?? "website",
    status: lead?.status ?? "new",
    ownerId: lead?.ownerId?._id ?? session?.user.id ?? "",
    estimatedValue: lead ? String(lead.estimatedValue ?? 0) : "",
    city: lead?.city ?? "",
    country: lead?.country ?? "",
    tags: lead?.tags?.join(", ") ?? "",
    nextFollowUpAt: toInputDate(lead?.nextFollowUpAt),
  });
  const form = useForm<LeadValues>({ defaultValues: defaults() });
  useEffect(() => {
    if (open) {
      form.reset(defaults());
      setDuplicates(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, lead?._id]);

  const save = useMutation({
    mutationFn: ({ v, allowDuplicate }: { v: LeadValues; allowDuplicate?: boolean }) => {
      const body: Record<string, unknown> = {
        firstName: v.firstName,
        lastName: v.lastName,
        email: v.email.trim(),
        phone: v.phone.trim(),
        companyName: v.companyName,
        jobTitle: v.jobTitle,
        source: v.source,
        ownerId: v.ownerId || null,
        estimatedValue: Number(v.estimatedValue || 0),
        city: v.city,
        country: v.country,
        tags: v.tags.split(",").map((t) => t.trim()).filter(Boolean),
        nextFollowUpAt: v.nextFollowUpAt ? new Date(`${v.nextFollowUpAt}T10:00:00`).toISOString() : null,
      };
      if (lead?.status !== "converted") body.status = v.status;
      if (lead) return api.patch<Lead>(`/leads/${lead._id}`, body);
      return api.post<Lead>("/leads", { ...body, ...(allowDuplicate ? { allowDuplicate: true } : {}) });
    },
    onSuccess: (saved) => {
      toast.success(lead ? "Lead updated" : "Lead created");
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead", saved._id] });
      qc.invalidateQueries({ queryKey: ["reports"] });
      onOpenChange(false);
      onSaved?.(saved);
    },
    onError: (err) => {
      if (err instanceof ApiError && err.code === "DUPLICATE_LEAD") {
        const d = (err.details as { duplicates?: typeof duplicates })?.duplicates;
        setDuplicates(d ?? []);
      }
      applyServerErrors(form, err);
    },
  });
  const e = form.formState.errors;
  const submit = form.handleSubmit((v) => save.mutate({ v }));

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={lead ? "Edit lead" : "New lead"}
      description={lead ? undefined : "Capture a new enquiry. Duplicate emails and phones are flagged automatically."}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} loading={save.isPending}>{lead ? "Save changes" : "Create lead"}</Button>
        </>
      }
    >
      {duplicates && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-medium text-amber-900">Possible duplicate</p>
              <p className="mt-0.5 text-amber-800">A lead with the same email or phone already exists:</p>
              <ul className="mt-2 space-y-1">
                {duplicates.map((d) => (
                  <li key={d._id}>
                    <Link href={`/leads/${d._id}`} className="font-medium text-amber-900 underline underline-offset-2" onClick={() => onOpenChange(false)}>
                      {fullName(d)}
                    </Link>{" "}
                    <span className="text-amber-700">{[d.email, d.phone].filter(Boolean).join(" · ")}</span>
                  </li>
                ))}
              </ul>
              {!lead && (
                <Button size="sm" variant="secondary" className="mt-3" loading={save.isPending} onClick={form.handleSubmit((v) => save.mutate({ v, allowDuplicate: true }))}>
                  Create anyway
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Field label="First name" required error={e.firstName?.message}>
          <Input autoFocus invalid={!!e.firstName} {...form.register("firstName", { required: "First name is required" })} />
        </Field>
        <Field label="Last name" error={e.lastName?.message}>
          <Input {...form.register("lastName")} />
        </Field>
        <Field label="Email" error={e.email?.message}>
          <Input type="email" invalid={!!e.email} {...form.register("email")} />
        </Field>
        <Field label="Phone" error={e.phone?.message}>
          <Input type="tel" placeholder="+91 98765 43210" invalid={!!e.phone} {...form.register("phone")} />
        </Field>
        <Field label="Company">
          <Input {...form.register("companyName")} />
        </Field>
        <Field label="Job title">
          <Input {...form.register("jobTitle")} />
        </Field>
        <Field label="Source">
          <Select {...form.register("source")}>
            {LEAD_SOURCES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Status">
          <Select {...form.register("status")} disabled={lead?.status === "converted"}>
            {LEAD_STATUSES.filter((s) => s.value !== "converted" || lead?.status === "converted").map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </Select>
        </Field>
        <Field label={`Estimated value (${currency})`} error={e.estimatedValue?.message}>
          <Input type="number" min={0} step="1000" {...form.register("estimatedValue")} />
        </Field>
        <Field label="Owner" error={e.ownerId?.message}>
          <MemberSelect value={form.watch("ownerId")} onChange={(v) => form.setValue("ownerId", v)} />
        </Field>
        <Field label="City">
          <Input {...form.register("city")} />
        </Field>
        <Field label="Country">
          <Input {...form.register("country")} />
        </Field>
        <Field label="Next follow-up">
          <Input type="date" {...form.register("nextFollowUpAt")} />
        </Field>
        <Field label="Tags" hint="Comma separated">
          <Input placeholder="hot, enterprise" {...form.register("tags")} />
        </Field>
      </form>
    </Dialog>
  );
}

// ---------------- Company ----------------

interface CompanyValues {
  name: string;
  domain: string;
  industry: string;
  size: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  ownerId: string;
}

export function CompanyFormDialog({ open, onOpenChange, company, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; company?: Company; onSaved?: (c: Company) => void }) {
  const qc = useQueryClient();
  const { data: session } = useSession();
  const defaults = (): CompanyValues => ({
    name: company?.name ?? "",
    domain: company?.domain ?? "",
    industry: company?.industry ?? "",
    size: company?.size ?? "",
    phone: company?.phone ?? "",
    address: company?.address ?? "",
    city: company?.city ?? "",
    country: company?.country ?? "",
    ownerId: company?.ownerId?._id ?? session?.user.id ?? "",
  });
  const form = useForm<CompanyValues>({ defaultValues: defaults() });
  useEffect(() => {
    if (open) form.reset(defaults());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, company?._id]);
  const save = useMutation({
    mutationFn: (v: CompanyValues) => {
      const body = { ...v, ownerId: v.ownerId || null };
      return company ? api.patch<Company>(`/companies/${company._id}`, body) : api.post<Company>("/companies", body);
    },
    onSuccess: (c) => {
      toast.success(company ? "Company updated" : "Company created");
      qc.invalidateQueries({ queryKey: ["companies"] });
      qc.invalidateQueries({ queryKey: ["company", c._id] });
      onOpenChange(false);
      onSaved?.(c);
    },
    onError: (err) => applyServerErrors(form, err),
  });
  const e = form.formState.errors;
  const submit = form.handleSubmit((v) => save.mutate(v));
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={company ? "Edit company" : "New company"}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} loading={save.isPending}>{company ? "Save changes" : "Create company"}</Button>
        </>
      }
    >
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Field label="Company name" required error={e.name?.message} className="sm:col-span-2">
          <Input autoFocus invalid={!!e.name} {...form.register("name", { required: "Company name is required" })} />
        </Field>
        <Field label="Website domain">
          <Input placeholder="acme.com" {...form.register("domain")} />
        </Field>
        <Field label="Phone">
          <Input {...form.register("phone")} />
        </Field>
        <Field label="Industry">
          <Select {...form.register("industry")}>
            <option value="">Select industry</option>
            {INDUSTRIES.map((i) => (
              <option key={i}>{i}</option>
            ))}
          </Select>
        </Field>
        <Field label="Size">
          <Select {...form.register("size")}>
            <option value="">Select size</option>
            {COMPANY_SIZES.map((i) => (
              <option key={i}>{i}</option>
            ))}
          </Select>
        </Field>
        <Field label="Address" className="sm:col-span-2">
          <Input {...form.register("address")} />
        </Field>
        <Field label="City">
          <Input {...form.register("city")} />
        </Field>
        <Field label="Country">
          <Input {...form.register("country")} />
        </Field>
        <Field label="Owner">
          <MemberSelect value={form.watch("ownerId")} onChange={(v) => form.setValue("ownerId", v)} />
        </Field>
      </form>
    </Dialog>
  );
}

// ---------------- Contact ----------------

interface ContactValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  city: string;
  country: string;
  ownerId: string;
}

export function ContactFormDialog({
  open,
  onOpenChange,
  contact,
  defaultCompany,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  contact?: Contact;
  defaultCompany?: { id: string; label: string };
  onSaved?: (c: Contact) => void;
}) {
  const qc = useQueryClient();
  const { data: session } = useSession();
  const [company, setCompany] = useState<{ id: string; label: string } | null>(null);
  const defaults = (): ContactValues => ({
    firstName: contact?.firstName ?? "",
    lastName: contact?.lastName ?? "",
    email: contact?.email ?? "",
    phone: contact?.phone ?? "",
    jobTitle: contact?.jobTitle ?? "",
    city: contact?.city ?? "",
    country: contact?.country ?? "",
    ownerId: contact?.ownerId?._id ?? session?.user.id ?? "",
  });
  const form = useForm<ContactValues>({ defaultValues: defaults() });
  useEffect(() => {
    if (open) {
      form.reset(defaults());
      setCompany(contact?.companyId ? { id: contact.companyId._id, label: contact.companyId.name } : (defaultCompany ?? null));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, contact?._id]);
  const save = useMutation({
    mutationFn: (v: ContactValues) => {
      const body = { ...v, email: v.email.trim(), phone: v.phone.trim(), ownerId: v.ownerId || null, companyId: company?.id ?? null };
      return contact ? api.patch<Contact>(`/contacts/${contact._id}`, body) : api.post<Contact>("/contacts", body);
    },
    onSuccess: (c) => {
      toast.success(contact ? "Contact updated" : "Contact created");
      qc.invalidateQueries({ queryKey: ["contacts"] });
      qc.invalidateQueries({ queryKey: ["contact", c._id] });
      qc.invalidateQueries({ queryKey: ["company"] });
      onOpenChange(false);
      onSaved?.(c);
    },
    onError: (err) => applyServerErrors(form, err),
  });
  const e = form.formState.errors;
  const submit = form.handleSubmit((v) => save.mutate(v));
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={contact ? "Edit contact" : "New contact"}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} loading={save.isPending}>{contact ? "Save changes" : "Create contact"}</Button>
        </>
      }
    >
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Field label="First name" required error={e.firstName?.message}>
          <Input autoFocus invalid={!!e.firstName} {...form.register("firstName", { required: "First name is required" })} />
        </Field>
        <Field label="Last name">
          <Input {...form.register("lastName")} />
        </Field>
        <Field label="Email" error={e.email?.message}>
          <Input type="email" invalid={!!e.email} {...form.register("email")} />
        </Field>
        <Field label="Phone">
          <Input type="tel" {...form.register("phone")} />
        </Field>
        <Field label="Job title">
          <Input {...form.register("jobTitle")} />
        </Field>
        <Field label="Company">
          <EntityPicker kind="companies" value={company} onChange={setCompany} placeholder="No company" />
        </Field>
        <Field label="City">
          <Input {...form.register("city")} />
        </Field>
        <Field label="Country">
          <Input {...form.register("country")} />
        </Field>
        <Field label="Owner">
          <MemberSelect value={form.watch("ownerId")} onChange={(v) => form.setValue("ownerId", v)} />
        </Field>
      </form>
    </Dialog>
  );
}

// ---------------- Deal ----------------

interface DealValues {
  title: string;
  pipelineId: string;
  stageId: string;
  value: string;
  probability: string;
  expectedCloseDate: string;
  ownerId: string;
}

export function DealFormDialog({
  open,
  onOpenChange,
  deal,
  defaults: preset,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  deal?: Deal;
  defaults?: { pipelineId?: string; stageId?: string; company?: { id: string; label: string }; contact?: { id: string; label: string } };
  onSaved?: (d: Deal) => void;
}) {
  const qc = useQueryClient();
  const { data: session } = useSession();
  const { data: pipelines } = usePipelines();
  const currency = useCurrency();
  const canOverride = session?.permissions.includes("pipeline:configure");
  const [company, setCompany] = useState<{ id: string; label: string } | null>(null);
  const [contact, setContact] = useState<{ id: string; label: string } | null>(null);
  const defaultPipeline = pipelines?.find((p) => p.isDefault) ?? pipelines?.[0];
  const defaults = (): DealValues => ({
    title: deal?.title ?? "",
    pipelineId: deal?.pipelineId ?? preset?.pipelineId ?? defaultPipeline?._id ?? "",
    stageId: deal?.stageId ?? preset?.stageId ?? "",
    value: deal ? String(deal.value) : "",
    probability: deal ? String(deal.probability) : "",
    expectedCloseDate: toInputDate(deal?.expectedCloseDate),
    ownerId: deal?.ownerId?._id ?? session?.user.id ?? "",
  });
  const form = useForm<DealValues>({ defaultValues: defaults() });
  useEffect(() => {
    if (open) {
      form.reset(defaults());
      setCompany(deal?.companyId ? { id: deal.companyId._id, label: deal.companyId.name } : (preset?.company ?? null));
      setContact(deal?.contactId ? { id: deal.contactId._id, label: fullName(deal.contactId) } : (preset?.contact ?? null));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, deal?._id, defaultPipeline?._id]);
  const pipelineId = form.watch("pipelineId");
  const pipeline = pipelines?.find((p) => p._id === pipelineId);
  const openStages = pipeline?.stages.filter((s) => s.type === "open") ?? [];

  const save = useMutation({
    mutationFn: (v: DealValues) => {
      const body: Record<string, unknown> = {
        title: v.title,
        value: Number(v.value || 0),
        expectedCloseDate: v.expectedCloseDate ? new Date(`${v.expectedCloseDate}T12:00:00`).toISOString() : null,
        ownerId: v.ownerId || null,
        companyId: company?.id ?? null,
        contactId: contact?.id ?? null,
      };
      if (v.probability !== "" && canOverride) body.probability = Number(v.probability);
      if (deal) return api.patch<Deal>(`/deals/${deal._id}`, body);
      return api.post<Deal>("/deals", { ...body, pipelineId: v.pipelineId || undefined, stageId: v.stageId || undefined });
    },
    onSuccess: (d) => {
      toast.success(deal ? "Deal updated" : "Deal created");
      qc.invalidateQueries({ queryKey: ["deals"] });
      qc.invalidateQueries({ queryKey: ["board"] });
      qc.invalidateQueries({ queryKey: ["deal", d._id] });
      qc.invalidateQueries({ queryKey: ["reports"] });
      onOpenChange(false);
      onSaved?.(d);
    },
    onError: (err) => applyServerErrors(form, err),
  });
  const e = form.formState.errors;
  const submit = form.handleSubmit((v) => save.mutate(v));
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={deal ? "Edit deal" : "New deal"}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} loading={save.isPending}>{deal ? "Save changes" : "Create deal"}</Button>
        </>
      }
    >
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Field label="Deal title" required error={e.title?.message} className="sm:col-span-2">
          <Input autoFocus placeholder="e.g. Acme Hotels - Annual plan" invalid={!!e.title} {...form.register("title", { required: "Title is required" })} />
        </Field>
        {!deal && (
          <>
            <Field label="Pipeline">
              <Select {...form.register("pipelineId", { onChange: () => form.setValue("stageId", "") })}>
                {pipelines?.map((p) => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Stage">
              <Select {...form.register("stageId")}>
                <option value="">{openStages[0]?.name ?? "First stage"} (default)</option>
                {openStages.slice(1).map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </Select>
            </Field>
          </>
        )}
        <Field label={`Value (${currency})`} error={e.value?.message}>
          <Input type="number" min={0} step="1000" {...form.register("value")} />
        </Field>
        <Field label="Expected close date">
          <Input type="date" {...form.register("expectedCloseDate")} />
        </Field>
        <Field label="Company">
          <EntityPicker kind="companies" value={company} onChange={setCompany} placeholder="No company" />
        </Field>
        <Field label="Primary contact">
          <EntityPicker kind="contacts" value={contact} onChange={setContact} placeholder="No contact" filter={company ? { companyId: company.id } : undefined} />
        </Field>
        <Field label="Owner">
          <MemberSelect value={form.watch("ownerId")} onChange={(v) => form.setValue("ownerId", v)} />
        </Field>
        {deal && (
          <Field label="Probability (%)" hint={canOverride ? "Override the stage default" : "Set by stage"} error={e.probability?.message}>
            <Input type="number" min={0} max={100} disabled={!canOverride} {...form.register("probability")} />
          </Field>
        )}
      </form>
    </Dialog>
  );
}

// ---------------- Task ----------------

interface TaskValues {
  title: string;
  description: string;
  type: string;
  priority: string;
  dueAt: string;
  assignedTo: string;
}

export function TaskFormDialog({
  open,
  onOpenChange,
  task,
  related,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  task?: Task;
  related?: { type: EntityType; id: string; name: string };
  onSaved?: () => void;
}) {
  const qc = useQueryClient();
  const { data: session } = useSession();
  const defaults = (): TaskValues => {
    const due = new Date();
    due.setDate(due.getDate() + 1);
    due.setHours(10, 0, 0, 0);
    return {
      title: task?.title ?? "",
      description: task?.description ?? "",
      type: task?.type ?? "call",
      priority: task?.priority ?? "medium",
      dueAt: toInputDateTime(task?.dueAt ?? due),
      assignedTo: task?.assignedTo?._id ?? session?.user.id ?? "",
    };
  };
  const form = useForm<TaskValues>({ defaultValues: defaults() });
  useEffect(() => {
    if (open) form.reset(defaults());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, task?._id]);
  const save = useMutation({
    mutationFn: (v: TaskValues) => {
      const body: Record<string, unknown> = { ...v, dueAt: new Date(v.dueAt).toISOString(), assignedTo: v.assignedTo || null };
      if (task) return api.patch(`/tasks/${task._id}`, body);
      return api.post("/tasks", { ...body, ...(related ? { relatedType: related.type, relatedId: related.id } : {}) });
    },
    onSuccess: () => {
      toast.success(task ? "Task updated" : "Task created");
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["task-counts"] });
      onOpenChange(false);
      onSaved?.();
    },
    onError: (err) => applyServerErrors(form, err),
  });
  const e = form.formState.errors;
  const submit = form.handleSubmit((v) => save.mutate(v));
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={task ? "Edit task" : "New task"}
      description={related ? `Related to ${related.name}` : task?.relatedName ? `Related to ${task.relatedName}` : undefined}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} loading={save.isPending}>{task ? "Save changes" : "Create task"}</Button>
        </>
      }
    >
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Field label="Title" required error={e.title?.message} className="sm:col-span-2">
          <Input autoFocus placeholder="Call to discuss proposal" invalid={!!e.title} {...form.register("title", { required: "Title is required" })} />
        </Field>
        <Field label="Type">
          <Select {...form.register("type")}>
            {TASK_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Priority">
          <Select {...form.register("priority")}>
            {PRIORITIES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Due" required error={e.dueAt?.message}>
          <Input type="datetime-local" {...form.register("dueAt", { required: "Due date is required" })} />
        </Field>
        <Field label="Assignee">
          <MemberSelect value={form.watch("assignedTo")} onChange={(v) => form.setValue("assignedTo", v)} />
        </Field>
        <Field label="Notes" className="sm:col-span-2">
          <Textarea rows={3} {...form.register("description")} />
        </Field>
      </form>
    </Dialog>
  );
}

export { nullIfEmpty };
