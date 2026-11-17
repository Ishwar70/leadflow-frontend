"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { MailOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/primitives";
import { api, ApiError, errorMessage } from "@/lib/api";
import { labelize } from "@/lib/utils";
import type { Session } from "@/lib/types";

interface InviteInfo {
  email: string;
  role: string;
  workspaceName: string;
  status: string;
  expired: boolean;
}

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const invite = useQuery({ queryKey: ["invite", token], queryFn: () => api.get<InviteInfo>(`/invitations/token/${token}`), retry: false });
  const session = useQuery({ queryKey: ["session"], queryFn: () => api.get<Session>("/auth/me"), retry: false });
  const accept = useMutation({
    mutationFn: () => api.post<Session>("/invitations/accept", { token }),
    onSuccess: () => {
      toast.success("Welcome aboard!");
      window.location.href = "/dashboard";
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  if (invite.isLoading || session.isLoading) return <Skeleton className="h-48 w-full" />;
  if (invite.isError || !invite.data) {
    return <p className="text-sm text-slate-600">This invitation link is invalid.</p>;
  }
  const inv = invite.data;
  const unusable = inv.expired || inv.status !== "pending";
  const loggedIn = session.data && !(session.error instanceof ApiError);
  const next = encodeURIComponent(`/invite/${token}`);

  return (
    <div>
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <MailOpen className="h-6 w-6" />
      </div>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-900">Join {inv.workspaceName}</h1>
      <p className="mt-2 text-sm text-slate-500">
        You&apos;ve been invited as <strong className="text-slate-700">{labelize(inv.role)}</strong> using <strong className="text-slate-700">{inv.email}</strong>.
      </p>
      {unusable ? (
        <p className="mt-6 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">This invitation has {inv.expired ? "expired" : `been ${inv.status}`}. Ask an admin to send a new one.</p>
      ) : loggedIn ? (
        <div className="mt-8 space-y-3">
          {session.data!.user.email !== inv.email && (
            <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
              You are signed in as {session.data!.user.email}. Sign in with {inv.email} to accept.
            </p>
          )}
          <Button size="lg" className="w-full" onClick={() => accept.mutate()} loading={accept.isPending} disabled={session.data!.user.email !== inv.email}>
            Accept invitation
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-2">
          <Link href={`/register?next=${next}`}>
            <Button size="lg" className="w-full">Create account to join</Button>
          </Link>
          <Link href={`/login?next=${next}`}>
            <Button size="lg" variant="secondary" className="w-full">I already have an account</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
