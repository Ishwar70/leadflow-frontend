"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { ArrowRight, Eye, EyeOff, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { api, ApiError, errorMessage } from "@/lib/api";
import type { Role, Session } from "@/lib/types";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const DEMO_ROLES: Array<{ role: Role; label: string }> = [
  { role: "owner", label: "Owner" },
  { role: "manager", label: "Manager" },
  { role: "sales_rep", label: "Sales rep" },
  { role: "viewer", label: "Viewer" },
];

function nextPath(session: Session) {
  const next = new URLSearchParams(window.location.search).get("next");
  const safe = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
  if (safe?.startsWith("/invite/")) return safe;
  if (!session.activeWorkspace) return "/onboarding";
  return safe ?? "/dashboard";
}

export default function LoginPage() {
  const qc = useQueryClient();
  const [show, setShow] = useState(false);
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  const onSession = (session: Session) => {
    qc.clear();
    qc.setQueryData(["session"], session);
    window.location.href = nextPath(session);
  };

  const login = useMutation({
    mutationFn: (v: z.infer<typeof schema>) => api.post<Session>("/auth/login", v),
    onSuccess: onSession,
    onError: (err) => {
      if (err instanceof ApiError && err.fieldErrors) {
        for (const [k, msg] of Object.entries(err.fieldErrors)) form.setError(k as "email", { message: msg });
      } else toast.error(errorMessage(err));
    },
  });

  const demo = useMutation({
    mutationFn: (role: Role) => api.post<Session>("/auth/demo", { role }),
    onSuccess: onSession,
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Welcome back</h1>
      <p className="mt-1.5 text-sm text-slate-500">Sign in to your LeadFlow workspace.</p>

      <form onSubmit={form.handleSubmit((v) => login.mutate(v))} className="mt-8 space-y-4" noValidate>
        <Field label="Email" htmlFor="email" error={form.formState.errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" placeholder="you@company.com" invalid={!!form.formState.errors.email} {...form.register("email")} />
        </Field>
        <Field label="Password" htmlFor="password" error={form.formState.errors.password?.message}>
          <div className="relative">
            <Input id="password" type={show ? "text" : "password"} autoComplete="current-password" className="pr-10" invalid={!!form.formState.errors.password} {...form.register("password")} />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label={show ? "Hide password" : "Show password"}>
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-xs font-medium text-brand-600 hover:text-brand-700">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full" size="lg" loading={login.isPending}>
          Sign in <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      <div className="mt-8 rounded-xl border border-brand-100 bg-gradient-to-br from-brand-50 to-violet-50/60 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Sparkles className="h-4 w-4 text-brand-600" /> Explore the live demo
        </div>
        <p className="mt-1 text-xs text-slate-600">Sign in instantly as a different role to see permissions in action.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {DEMO_ROLES.map((d) => (
            <Button key={d.role} variant="secondary" size="sm" loading={demo.isPending && demo.variables === d.role} disabled={demo.isPending} onClick={() => demo.mutate(d.role)}>
              {d.label}
            </Button>
          ))}
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-slate-500">
        New to LeadFlow?{" "}
        <Link href="/register" className="font-medium text-brand-600 hover:text-brand-700">
          Create an account
        </Link>
      </p>
    </div>
  );
}
