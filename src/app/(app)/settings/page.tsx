"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select } from "@/components/ui/form";
import { Badge, Card, CardHeader, PageHeader, Skeleton } from "@/components/ui/primitives";
import { api, ApiError, errorMessage } from "@/lib/api";
import { COMPANY_SIZES, CURRENCIES, INDUSTRIES, ROLES, TIMEZONES } from "@/lib/constants";
import { useCan, useSession } from "@/lib/hooks";
import { labelize } from "@/lib/utils";

interface WorkspaceDetail {
  _id: string;
  name: string;
  industry: string;
  size: string;
  country: string;
  timezone: string;
  currency: string;
  isDemo: boolean;
  settings?: { autoAssignPublicLeads?: boolean };
}

const withCurrent = (list: string[], v: string) => (v && !list.includes(v) ? [v, ...list] : list);

function WorkspaceForm({ ws, editable }: { ws: WorkspaceDetail; editable: boolean }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: ws.name,
    industry: ws.industry ?? "",
    size: ws.size ?? "",
    country: ws.country ?? "",
    timezone: ws.timezone ?? "UTC",
    currency: ws.currency ?? "INR",
    autoAssignPublicLeads: ws.settings?.autoAssignPublicLeads ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const save = useMutation({
    mutationFn: () => api.patch("/workspaces/current", form),
    onSuccess: () => {
      setErrors({});
      toast.success("Workspace settings saved");
      qc.invalidateQueries({ queryKey: ["workspace"] });
      qc.invalidateQueries({ queryKey: ["session"] });
    },
    onError: (err) => {
      if (err instanceof ApiError && err.fieldErrors) setErrors(err.fieldErrors);
      toast.error(errorMessage(err));
    },
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
            <form
              className="grid gap-4 p-5 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate();
              }}
            >
              <Field label="Workspace name" error={errors.name} className="sm:col-span-2" required>
                <Input value={form.name} onChange={(e) => set("name", e.target.value)} disabled={!editable} invalid={!!errors.name} />
              </Field>
              <Field label="Industry">
                <Select value={form.industry} onChange={(e) => set("industry", e.target.value)} disabled={!editable}>
                  {withCurrent(INDUSTRIES, form.industry).map((i) => <option key={i}>{i}</option>)}
                </Select>
              </Field>
              <Field label="Team size">
                <Select value={form.size} onChange={(e) => set("size", e.target.value)} disabled={!editable}>
                  {withCurrent(COMPANY_SIZES, form.size).map((i) => <option key={i}>{i}</option>)}
                </Select>
              </Field>
              <Field label="Country">
                <Input value={form.country} onChange={(e) => set("country", e.target.value)} disabled={!editable} />
              </Field>
              <Field label="Currency" hint="Used for deal values and reports.">
                <Select value={form.currency} onChange={(e) => set("currency", e.target.value)} disabled={!editable}>
                  {withCurrent(CURRENCIES, form.currency).map((i) => <option key={i}>{i}</option>)}
                </Select>
              </Field>
              <Field label="Timezone" className="sm:col-span-2">
                <Select value={form.timezone} onChange={(e) => set("timezone", e.target.value)} disabled={!editable}>
                  {withCurrent(TIMEZONES, form.timezone).map((i) => <option key={i}>{i}</option>)}
                </Select>
              </Field>
              <label className="flex items-start gap-3 rounded-xl border border-line bg-slate-50/60 p-4 sm:col-span-2">
                <Checkbox checked={form.autoAssignPublicLeads} onChange={(e) => set("autoAssignPublicLeads", e.target.checked)} disabled={!editable} className="mt-0.5" />
                <span>
                  <span className="block text-sm font-medium text-slate-800">Round-robin assignment for website leads</span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    Leads captured through the public API are distributed evenly across active sales reps, with a call task due in 2 hours. When off, they are assigned to the workspace owner.
                  </span>
                </span>
              </label>
              {editable && (
                <div className="flex justify-end sm:col-span-2">
                  <Button type="submit" loading={save.isPending}>Save changes</Button>
                </div>
              )}
            </form>
  );
}

export default function SettingsPage() {
  const can = useCan();
  const { data: session } = useSession();
  const editable = can("workspace:manage");
  const { data: ws, isLoading } = useQuery({ queryKey: ["workspace"], queryFn: () => api.get<WorkspaceDetail>("/workspaces/current") });
  const role = session?.activeWorkspace?.role;
  const roleInfo = ROLES.find((r) => r.value === role);

  return (
    <div className="max-w-4xl">
      <PageHeader title="Workspace settings" description="Company profile, regional preferences and lead routing." />
      <div className="space-y-6">
        <Card>
          <CardHeader
            title="Company profile"
            description={editable ? "Visible to everyone in this workspace." : "Only owners and admins can change these settings."}
            action={ws?.isDemo && <Badge tone="violet"><Sparkles className="h-3 w-3" /> Demo workspace</Badge>}
          />
          {isLoading || !ws ? (
            <div className="grid gap-4 p-5 sm:grid-cols-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : (
            <WorkspaceForm key={ws._id} ws={ws} editable={editable} />
          )}
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader title="Your access" description={session?.user.email} />
            <div className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{roleInfo?.label ?? labelize(role ?? "")}</p>
                  <p className="text-xs text-slate-500">{roleInfo?.description}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {session?.permissions.map((p) => <Badge key={p} tone="brand">{labelize(p.replace(":", " "))}</Badge>)}
              </div>
            </div>
          </Card>
          <Card>
            <CardHeader title="Workspaces" description={`You belong to ${session?.workspaces.length ?? 0} workspace(s).`} />
            <div className="space-y-2 p-5">
              {session?.workspaces.map((w) => (
                <div key={w.id} className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-sm">
                  <span className="truncate font-medium text-slate-800">{w.name}</span>
                  <span className="flex items-center gap-2">
                    {w.id === session.activeWorkspace?.id && <Badge tone="emerald" dot>Active</Badge>}
                    <Badge>{labelize(w.role)}</Badge>
                  </span>
                </div>
              ))}
              <Link href="/onboarding">
                <Button variant="secondary" className="mt-2 w-full"><Plus className="h-4 w-4" /> Create another workspace</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
