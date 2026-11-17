"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Copy, KeyRound, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/form";
import { Badge, Card, CardHeader, EmptyState, PageHeader, Skeleton, Table, Td, Th } from "@/components/ui/primitives";
import { api, errorMessage } from "@/lib/api";
import { useBrowserValue, useCan } from "@/lib/hooks";
import { formatDate, timeAgo } from "@/lib/utils";

interface ApiKey {
  _id: string;
  name: string;
  prefix: string;
  createdBy: { name: string } | null;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

async function copy(text: string, label = "Copied to clipboard") {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(label);
  } catch {
    toast.error("Copy failed — select the text manually");
  }
}

export default function ApiKeysPage() {
  const qc = useQueryClient();
  const can = useCan();
  const allowed = can("apikeys:manage");
  const { data: keys, isLoading } = useQuery({ queryKey: ["api-keys"], queryFn: () => api.get<ApiKey[]>("/api-keys"), enabled: allowed });
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("Website form");
  const [secret, setSecret] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<ApiKey | null>(null);
  const origin = useBrowserValue(() => window.location.origin, "https://your-app.vercel.app");

  const create = useMutation({
    mutationFn: () => api.post<{ key: string }>("/api-keys", { name }),
    onSuccess: (r) => {
      setSecret(r.key);
      qc.invalidateQueries({ queryKey: ["api-keys"] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
  const revoke = useMutation({
    mutationFn: (id: string) => api.del(`/api-keys/${id}`),
    onSuccess: () => {
      toast.success("API key revoked");
      setRevoking(null);
      qc.invalidateQueries({ queryKey: ["api-keys"] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const curl = `curl -X POST ${origin}/api/public/leads \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${secret ?? "lf_live_your_key"}" \\
  -H "Idempotency-Key: form-submission-123" \\
  -d '{"firstName":"Asha","lastName":"Verma","email":"asha@example.com","phone":"9876543210","companyName":"Example Co","message":"Interested in a demo"}'`;

  if (!allowed)
    return (
      <Card className="max-w-3xl">
        <EmptyState icon={<KeyRound className="h-5 w-5" />} title="Admins only" description="Only workspace owners and admins can manage API keys." />
      </Card>
    );

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="API keys"
        description="Capture leads from your website or other tools straight into this workspace."
        actions={<Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Create key</Button>}
      />
      <Card>
        {isLoading ? (
          <div className="space-y-3 p-5">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : !keys?.length ? (
          <EmptyState icon={<KeyRound className="h-5 w-5" />} title="No API keys yet" description="Create a key to start sending leads from your website forms." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Key</Th>
                <Th>Created</Th>
                <Th>Last used</Th>
                <Th>Status</Th>
                <Th className="w-24" />
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k._id}>
                  <Td className="font-medium text-slate-900">{k.name}</Td>
                  <Td><code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{k.prefix}…</code></Td>
                  <Td className="text-slate-500">{formatDate(k.createdAt)}{k.createdBy && <span className="block text-xs">by {k.createdBy.name}</span>}</Td>
                  <Td className="text-slate-500">{k.lastUsedAt ? timeAgo(k.lastUsedAt) : "Never"}</Td>
                  <Td>{k.revokedAt ? <Badge tone="rose">Revoked</Badge> : <Badge tone="emerald" dot>Active</Badge>}</Td>
                  <Td>{!k.revokedAt && <Button size="sm" variant="ghost" onClick={() => setRevoking(k)}>Revoke</Button>}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Card className="mt-6">
        <CardHeader title="Website lead capture" description="POST leads to the public endpoint. New leads are round-robin assigned and get a call task due in 2 hours." action={<Button size="sm" variant="secondary" onClick={() => copy(curl, "Example copied")}><Copy className="h-3.5 w-3.5" /> Copy</Button>} />
        <pre className="overflow-x-auto bg-ink-950 p-5 text-xs leading-relaxed text-slate-200 scrollbar-thin rounded-b-xl">{curl}</pre>
      </Card>

      <Dialog
        open={createOpen}
        onOpenChange={(o) => {
          setCreateOpen(o);
          if (!o) setTimeout(() => setSecret(null), 200);
        }}
        size="md"
        title={secret ? "Your new API key" : "Create API key"}
        footer={
          secret ? (
            <Button onClick={() => setCreateOpen(false)}>I&apos;ve saved it</Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={() => create.mutate()} disabled={!name.trim()} loading={create.isPending}>Create key</Button>
            </>
          )
        }
      >
        {secret ? (
          <div className="space-y-4">
            <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Copy this key now. For security it is stored hashed and will never be shown again.
            </div>
            <div className="flex gap-2">
              <Input readOnly value={secret} onFocus={(e) => e.target.select()} className="font-mono text-xs" />
              <Button variant="secondary" onClick={() => copy(secret, "API key copied")}><Copy className="h-4 w-4" /> Copy</Button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) create.mutate();
            }}
          >
            <Field label="Key name" hint="A label to recognise where this key is used." required>
              <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            </Field>
          </form>
        )}
      </Dialog>
      <ConfirmDialog
        open={!!revoking}
        onOpenChange={(o) => !o && setRevoking(null)}
        title="Revoke API key?"
        description={`Integrations using "${revoking?.name}" will immediately stop working.`}
        confirmLabel="Revoke"
        onConfirm={() => revoking && revoke.mutate(revoking._id)}
        loading={revoke.isPending}
      />
    </div>
  );
}
