"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Building2, Check } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { Card } from "@/components/ui/primitives";
import { api, errorMessage } from "@/lib/api";
import { COMPANY_SIZES, CURRENCIES, INDUSTRIES, TIMEZONES } from "@/lib/constants";
import { useLogout, useSession } from "@/lib/hooks";
import type { Session } from "@/lib/types";

const schema = z.object({
  name: z.string().trim().min(2, "Workspace name is required"),
  industry: z.string(),
  size: z.string(),
  country: z.string().trim().min(2),
  timezone: z.string().min(1),
  currency: z.string().length(3),
});
export default function OnboardingPage() {
  const qc = useQueryClient();
  const { data: session } = useSession();
  const logout = useLogout();
  const browserTz = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "Asia/Kolkata";
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      industry: "Software services",
      size: "1-10",
      country: "India",
      timezone: TIMEZONES.includes(browserTz) ? browserTz : "Asia/Kolkata",
      currency: "INR",
    },
  });
  const create = useMutation({
    mutationFn: (v: z.infer<typeof schema>) => api.post<Session>("/workspaces", v),
    onSuccess: (s) => {
      qc.clear();
      qc.setQueryData(["session"], s);
      toast.success("Workspace created with a default sales pipeline");
      window.location.href = "/dashboard";
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
  const e = form.formState.errors;

  return (
    <div className="min-h-screen bg-surface">
      <header className="flex items-center justify-between border-b border-line bg-white px-6 py-4">
        <Logo />
        <Button variant="ghost" size="sm" onClick={() => logout.mutate()}>
          Sign out
        </Button>
      </header>
      <main className="mx-auto grid max-w-5xl gap-10 px-6 py-12 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <p className="text-sm font-medium text-brand-600">Welcome{session ? `, ${session.user.name.split(" ")[0]}` : ""}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Set up your workspace</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            A workspace holds your team, pipeline and customer data. Everything inside it is isolated from other workspaces.
          </p>
          <ul className="mt-8 space-y-4">
            {["Company details & currency", "Default pipeline: Discovery → Won", "Invite your team from Settings", "Import leads from CSV"].map((s, i) => (
              <li key={s} className="flex items-center gap-3 text-sm text-slate-700">
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${i === 0 ? "bg-brand-600 text-white" : "bg-white text-slate-400 ring-1 ring-line"}`}>
                  {i === 0 ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                {s}
              </li>
            ))}
          </ul>
          {session && session.workspaces.length > 0 && (
            <Button variant="secondary" className="mt-8" onClick={() => (window.location.href = "/dashboard")}>
              Back to my workspace
            </Button>
          )}
        </div>
        <Card className="p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Company details</h2>
              <p className="text-xs text-slate-500">You can change these later in settings.</p>
            </div>
          </div>
          <form onSubmit={form.handleSubmit((v) => create.mutate(v))} className="grid gap-4 sm:grid-cols-2" noValidate>
            <Field label="Workspace name" error={e.name?.message} className="sm:col-span-2" required>
              <Input placeholder="e.g. Northwind Growth Partners" invalid={!!e.name} {...form.register("name")} />
            </Field>
            <Field label="Industry">
              <Select {...form.register("industry")}>
                {INDUSTRIES.map((i) => (
                  <option key={i}>{i}</option>
                ))}
              </Select>
            </Field>
            <Field label="Team size">
              <Select {...form.register("size")}>
                {COMPANY_SIZES.map((i) => (
                  <option key={i}>{i}</option>
                ))}
              </Select>
            </Field>
            <Field label="Country">
              <Input {...form.register("country")} />
            </Field>
            <Field label="Currency">
              <Select {...form.register("currency")}>
                {CURRENCIES.map((i) => (
                  <option key={i}>{i}</option>
                ))}
              </Select>
            </Field>
            <Field label="Timezone" className="sm:col-span-2">
              <Select {...form.register("timezone")}>
                {TIMEZONES.map((i) => (
                  <option key={i}>{i}</option>
                ))}
              </Select>
            </Field>
            <Button type="submit" size="lg" className="sm:col-span-2" loading={create.isPending}>
              Create workspace
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
}
