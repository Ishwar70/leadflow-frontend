"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { api, errorMessage } from "@/lib/api";
import { useBrowserValue } from "@/lib/hooks";

export default function ResetPasswordPage() {
  const token = useBrowserValue(() => new URLSearchParams(window.location.search).get("token") ?? "", "");
  const [password, setPassword] = useState("");
  const reset = useMutation({
    mutationFn: () => api.post("/auth/reset-password", { token, password }),
    onSuccess: () => {
      toast.success("Password updated");
      window.location.href = "/dashboard";
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Choose a new password</h1>
      <p className="mt-1.5 text-sm text-slate-500">Use at least 8 characters with a letter and a number.</p>
      <form
        className="mt-8 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          reset.mutate();
        }}
      >
        <Field label="New password" htmlFor="password">
          <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={reset.isPending} disabled={!token}>
          Update password
        </Button>
        {!token && <p className="text-xs text-rose-600">This page needs a valid reset link.</p>}
      </form>
    </div>
  );
}
