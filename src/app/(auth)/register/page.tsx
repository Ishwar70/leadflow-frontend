"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { api, ApiError, errorMessage } from "@/lib/api";
import type { Session } from "@/lib/types";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email"),
  password: z
    .string()
    .min(8, "At least 8 characters")
    .regex(/[A-Za-z]/, "Include a letter")
    .regex(/\d/, "Include a number"),
});

export default function RegisterPage() {
  const qc = useQueryClient();
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  const register = useMutation({
    mutationFn: (v: z.infer<typeof schema>) => api.post<Session>("/auth/register", v),
    onSuccess: (session) => {
      qc.setQueryData(["session"], session);
      const next = new URLSearchParams(window.location.search).get("next");
      window.location.href = next && next.startsWith("/invite/") ? next : "/onboarding";
    },
    onError: (err) => {
      if (err instanceof ApiError && err.fieldErrors) {
        for (const [k, msg] of Object.entries(err.fieldErrors)) form.setError(k as "email", { message: msg });
      } else toast.error(errorMessage(err));
    },
  });
  const e = form.formState.errors;

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Create your account</h1>
      <p className="mt-1.5 text-sm text-slate-500">Set up a workspace for your sales team in minutes.</p>
      <form onSubmit={form.handleSubmit((v) => register.mutate(v))} className="mt-8 space-y-4" noValidate>
        <Field label="Full name" htmlFor="name" error={e.name?.message}>
          <Input id="name" autoComplete="name" placeholder="Aarav Mehta" invalid={!!e.name} {...form.register("name")} />
        </Field>
        <Field label="Work email" htmlFor="email" error={e.email?.message}>
          <Input id="email" type="email" autoComplete="email" placeholder="you@company.com" invalid={!!e.email} {...form.register("email")} />
        </Field>
        <Field label="Password" htmlFor="password" error={e.password?.message} hint="At least 8 characters with a letter and a number">
          <Input id="password" type="password" autoComplete="new-password" invalid={!!e.password} {...form.register("password")} />
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={register.isPending}>
          Create account
        </Button>
      </form>
      <p className="mt-8 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">
          Sign in
        </Link>
      </p>
    </div>
  );
}
