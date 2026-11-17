"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, Link2, Lock, MailPlus, MoreHorizontal, UserMinus, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, Dialog, Dropdown, DropdownContent, DropdownItem, DropdownLabel, DropdownSeparator, DropdownTrigger } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/form";
import { Avatar, Badge, Card, CardHeader, EmptyState, PageHeader, Skeleton, Table, Td, Th } from "@/components/ui/primitives";
import { api, ApiError, errorMessage } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import { useCan, useMembers, useSession } from "@/lib/hooks";
import type { Member, Role } from "@/lib/types";
import { formatDate, labelize, timeAgo } from "@/lib/utils";

interface Invitation {
  _id: string;
  email: string;
  role: Role;
  expiresAt: string;
  createdAt: string;
  expired: boolean;
}

const roleTone = { owner: "violet", admin: "brand", manager: "sky", sales_rep: "emerald", viewer: "slate" } as const;

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Invite link copied");
  } catch {
    toast.error("Copy failed — select the link manually");
  }
}

function InviteDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const qc = useQueryClient();
  const { data: session } = useSession();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("sales_rep");
  const [error, setError] = useState<string>();
  const [result, setResult] = useState<{ inviteUrl: string; emailSent: boolean; email: string } | null>(null);
  const isOwner = session?.activeWorkspace?.role === "owner";

  const invite = useMutation({
    mutationFn: () => api.post<{ inviteUrl: string; emailSent: boolean; email: string }>("/invitations", { email, role }),
    onSuccess: (r) => {
      setResult(r);
      setError(undefined);
      qc.invalidateQueries({ queryKey: ["invitations"] });
    },
    onError: (err) => {
      if (err instanceof ApiError && err.fieldErrors?.email) setError(err.fieldErrors.email);
      else toast.error(errorMessage(err));
    },
  });

  const close = (o: boolean) => {
    onOpenChange(o);
    if (!o) {
      setTimeout(() => {
        setResult(null);
        setEmail("");
        setRole("sales_rep");
        setError(undefined);
      }, 200);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={close}
      title={result ? "Invitation created" : "Invite a teammate"}
      description={result ? undefined : "They'll join this workspace with the role you choose."}
      footer={
        result ? (
          <Button onClick={() => close(false)}>Done</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={() => close(false)}>Cancel</Button>
            <Button onClick={() => invite.mutate()} loading={invite.isPending} disabled={!email.trim()}>
              <MailPlus className="h-4 w-4" /> Create invite
            </Button>
          </>
        )
      }
    >
      {result ? (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            {result.emailSent ? (
              <>An invitation email was sent to <strong>{result.email}</strong>. You can also share this link directly:</>
            ) : (
              <>Share this link with <strong>{result.email}</strong>. It expires in 7 days and can only be accepted by that email address.</>
            )}
          </p>
          <div className="flex gap-2">
            <Input readOnly value={result.inviteUrl} onFocus={(e) => e.target.select()} className="font-mono text-xs" />
            <Button variant="secondary" onClick={() => copy(result.inviteUrl)}><Copy className="h-4 w-4" /> Copy</Button>
          </div>
        </div>
      ) : (
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (email.trim()) invite.mutate();
          }}
        >
          <Field label="Email address" error={error} required>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@company.com" invalid={!!error} autoFocus />
          </Field>
          <Field label="Role">
            <div className="grid gap-2">
              {ROLES.filter((r) => r.value !== "owner" && (r.value !== "admin" || isOwner)).map((r) => (
                <label key={r.value} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${role === r.value ? "border-brand-300 bg-brand-50/60" : "border-line hover:bg-slate-50"}`}>
                  <input type="radio" name="role" className="mt-1 accent-brand-600" checked={role === r.value} onChange={() => setRole(r.value as Role)} />
                  <span>
                    <span className="block text-sm font-medium text-slate-800">{r.label}</span>
                    <span className="block text-xs text-slate-500">{r.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </Field>
        </form>
      )}
    </Dialog>
  );
}

function DeactivateDialog({ member, members, onClose }: { member: Member | null; members: Member[]; onClose: () => void }) {
  const qc = useQueryClient();
  const [transferTo, setTransferTo] = useState("");
  const options = members.filter((m) => m.status === "active" && m.userId !== member?.userId && m.role !== "viewer");
  const deactivate = useMutation({
    mutationFn: () => api.post<{ transferred: Record<string, number> }>(`/members/${member!.userId}/deactivate`, { transferTo }),
    onSuccess: (r) => {
      const t = r.transferred;
      toast.success(`${member?.name} deactivated`, { description: `Transferred ${t.leads} leads, ${t.deals} deals, ${t.contacts} contacts, ${t.companies} companies and ${t.tasks} open tasks.` });
      qc.invalidateQueries({ queryKey: ["members"] });
      onClose();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
  return (
    <Dialog
      open={!!member}
      onOpenChange={(o) => {
        if (!o) {
          onClose();
          setTransferTo("");
        }
      }}
      size="sm"
      title={`Deactivate ${member?.name ?? ""}`}
      description="They will lose access immediately. Their records must be transferred to an active teammate."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="danger" disabled={!transferTo} loading={deactivate.isPending} onClick={() => deactivate.mutate()}>Deactivate & transfer</Button>
        </>
      }
    >
      <Field label="Transfer leads, deals, contacts, companies and open tasks to" required>
        <Select value={transferTo} onChange={(e) => setTransferTo(e.target.value)}>
          <option value="">Select a member…</option>
          {options.map((m) => <option key={m.userId} value={m.userId}>{m.name} · {labelize(m.role)}</option>)}
        </Select>
      </Field>
    </Dialog>
  );
}

export default function TeamPage() {
  const qc = useQueryClient();
  const can = useCan();
  const { data: session } = useSession();
  const manage = can("members:manage");
  const { data: members, isLoading } = useMembers();
  const { data: invites } = useQuery({ queryKey: ["invitations"], queryFn: () => api.get<Invitation[]>("/invitations"), enabled: manage });
  const [inviteOpen, setInviteOpen] = useState(false);
  const [deactivating, setDeactivating] = useState<Member | null>(null);
  const [revoking, setRevoking] = useState<Invitation | null>(null);
  const me = session?.user.id;
  const myRole = session?.activeWorkspace?.role;

  const changeRole = useMutation({
    mutationFn: (v: { userId: string; role: Role }) => api.patch(`/members/${v.userId}`, { role: v.role }),
    onSuccess: () => {
      toast.success("Role updated");
      qc.invalidateQueries({ queryKey: ["members"] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
  const reactivate = useMutation({
    mutationFn: (userId: string) => api.post(`/members/${userId}/reactivate`),
    onSuccess: () => {
      toast.success("Member reactivated");
      qc.invalidateQueries({ queryKey: ["members"] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
  const revoke = useMutation({
    mutationFn: (id: string) => api.del(`/invitations/${id}`),
    onSuccess: () => {
      toast.success("Invitation revoked");
      setRevoking(null);
      qc.invalidateQueries({ queryKey: ["invitations"] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const active = members?.filter((m) => m.status === "active").length ?? 0;

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Team"
        description={members ? `${active} active member${active === 1 ? "" : "s"}` : "Manage who can access this workspace."}
        actions={manage && <Button onClick={() => setInviteOpen(true)}><UserPlus className="h-4 w-4" /> Invite member</Button>}
      />
      <Card>
        {isLoading ? (
          <div className="space-y-3 p-5">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Member</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th>Joined</Th>
                <Th className="w-12" />
              </tr>
            </thead>
            <tbody>
              {members?.map((m) => {
                const editable = manage && m.role !== "owner" && m.userId !== me && !(m.role === "admin" && myRole !== "owner");
                return (
                  <tr key={m.userId} className={m.status === "deactivated" ? "opacity-60" : ""}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <Avatar name={m.name} size="sm" />
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900">{m.name}{m.userId === me && <span className="ml-1.5 text-xs font-normal text-slate-400">(you)</span>}</p>
                          <p className="text-xs text-slate-500">{m.email}</p>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      {editable && m.status === "active" ? (
                        <Select
                          value={m.role}
                          onChange={(e) => changeRole.mutate({ userId: m.userId, role: e.target.value as Role })}
                          className="h-8 w-36 text-xs"
                        >
                          {ROLES.filter((r) => r.value !== "owner" && (r.value !== "admin" || myRole === "owner")).map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </Select>
                      ) : (
                        <Badge tone={roleTone[m.role]}>{m.role === "owner" && <Lock className="h-3 w-3" />}{labelize(m.role)}</Badge>
                      )}
                    </Td>
                    <Td>{m.status === "active" ? <Badge tone="emerald" dot>Active</Badge> : <Badge dot>Deactivated</Badge>}</Td>
                    <Td className="text-slate-500">{formatDate(m.joinedAt)}</Td>
                    <Td>
                      {editable && (
                        <Dropdown>
                          <DropdownTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Member actions"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownTrigger>
                          <DropdownContent>
                            <DropdownLabel>{m.name}</DropdownLabel>
                            <DropdownSeparator />
                            {m.status === "active" ? (
                              <DropdownItem danger onSelect={() => setDeactivating(m)}><UserMinus className="h-4 w-4" /> Deactivate</DropdownItem>
                            ) : (
                              <DropdownItem onSelect={() => reactivate.mutate(m.userId)}><UserPlus className="h-4 w-4" /> Reactivate</DropdownItem>
                            )}
                          </DropdownContent>
                        </Dropdown>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      {manage && (
        <Card className="mt-6">
          <CardHeader title="Pending invitations" description="Invite links are shown once when created. Revoke and re-invite to generate a new link." />
          {!invites?.length ? (
            <EmptyState icon={<Link2 className="h-5 w-5" />} title="No pending invitations" description="Invite teammates to collaborate on leads and deals." />
          ) : (
            <div className="divide-y divide-line/70">
              {invites.map((i) => (
                <div key={i._id} className="flex items-center justify-between gap-4 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{i.email}</p>
                    <p className="text-xs text-slate-500">
                      {labelize(i.role)} · sent {timeAgo(i.createdAt)} · {i.expired ? <span className="text-rose-600">expired</span> : `expires ${formatDate(i.expiresAt)}`}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setRevoking(i)}><X className="h-3.5 w-3.5" /> Revoke</Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} />
      <DeactivateDialog member={deactivating} members={members ?? []} onClose={() => setDeactivating(null)} />
      <ConfirmDialog
        open={!!revoking}
        onOpenChange={(o) => !o && setRevoking(null)}
        title="Revoke invitation?"
        description={`The invite link sent to ${revoking?.email} will stop working.`}
        confirmLabel="Revoke"
        onConfirm={() => revoking && revoke.mutate(revoking._id)}
        loading={revoke.isPending}
      />
    </div>
  );
}
