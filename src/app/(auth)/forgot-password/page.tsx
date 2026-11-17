"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { api, errorMessage } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const send = useMutation({
    mutationFn: () => api.post<{ message: string }>("/auth/forgot-password", { email }),
    onError: (err) => toast.error(errorMessage(err)),
  });

  if (send.isSuccess) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <MailCheck className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-xl font-semibold text-slate-900">Check your inbox</h1>
        <p className="mt-2 text-sm text-slate-500">{send.data.message}</p>
        <Link href="/login" className="mt-6 inline-block text-sm font-medium text-brand-600">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Reset your password</h1>
      <p className="mt-1.5 text-sm text-slate-500">We&apos;ll email you a secure link to set a new password.</p>
      <form
        className="mt-8 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          send.mutate();
        }}
      >
        <Field label="Email" htmlFor="email">
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={send.isPending}>
          Send reset link
        </Button>
      </form>
      <p className="mt-8 text-center text-sm">
        <Link href="/login" className="font-medium text-brand-600">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
