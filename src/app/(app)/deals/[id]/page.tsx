"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Archive, Check, Clock, Pencil, RotateCcw, Trophy, XCircle } from "lucide-react";
import { DealStatusBadge } from "@/components/app/badges";
import { DealFormDialog } from "@/components/app/forms";
import { RelatedTasks } from "@/components/app/task-list";
import { Timeline } from "@/components/app/timeline";
import { WonLostDialog } from "@/components/app/won-lost-dialog";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Avatar, Badge, Card, CardHeader, DetailRow, EmptyState, PageHeader, Skeleton } from "@/components/ui/primitives";
import { api, errorMessage } from "@/lib/api";
import { STALE_DAYS } from "@/lib/constants";
import { useCan } from "@/lib/hooks";
import type { Deal, Pipeline } from "@/lib/types";
import { cn, formatDate, formatDateTime, formatMoney, fullName, timeAgo } from "@/lib/utils";

type DealDetail = Deal & {
  pipeline: Pipeline | null;
  history: Array<{ _id: string; fromStageName: string | null; toStageName: string; changedBy: { name: string } | null; createdAt: string }>;
};

export default function DealDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const can = useCan();
  const [edit, setEdit] = useState(false);
  const [mode, setMode] = useState<"won" | "lost" | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [now] = useState(() => Date.now());
  const { data: d, isLoading, error } = useQuery({ queryKey: ["deal", id], queryFn: () => api.get<DealDetail>(`/deals/${id}`) });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["deal", id] });
    qc.invalidateQueries({ queryKey: ["activities"] });
    qc.invalidateQueries({ queryKey: ["board"] });
    qc.invalidateQueries({ queryKey: ["reports"] });
  };
  const move = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.patch(`/deals/${id}/stage`, body),
    onSuccess: (_r, body) => {
      const stage = d?.pipeline?.stages.find((s) => s._id === body.stageId);
      toast.success(stage?.type === "won" ? "Deal won! 🎉" : `Moved to ${stage?.name}`);
      setMode(null);
      refresh();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
  const archive = useMutation({
    mutationFn: () => api.post(`/deals/${id}/archive`),
    onSuccess: () => {
      toast.success("Deal archived");
      qc.invalidateQueries({ queryKey: ["board"] });
      router.push("/deals");
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  if (isLoading) return <Skeleton className="h-96" />;
  if (error || !d)
    return <EmptyState title="Deal not found" description="It may have been archived or you may not have access." action={<Link href="/deals"><Button variant="secondary">Back to deals</Button></Link>} />;

  const stages = d.pipeline?.stages ?? [];
  const current = stages.find((s) => s._id === d.stageId);
  const wonStage = stages.find((s) => s.type === "won");
  const lostStage = stages.find((s) => s.type === "lost");
  const openStages = stages.filter((s) => s.type === "open");
  const currentIdx = openStages.findIndex((s) => s._id === d.stageId);
  const stale = d.status === "open" && now - new Date(d.stageChangedAt).getTime() > STALE_DAYS * 86400000;
  const canUpdate = can("records:update");

  return (
    <div>
      <PageHeader
        back={{ href: "/deals", label: "Deals" }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {d.title}
            <DealStatusBadge status={d.status} />
            {stale && <Badge tone="amber"><Clock className="h-3 w-3" /> No movement in {STALE_DAYS}+ days</Badge>}
          </span>
        }
        description={`${d.pipeline?.name ?? "Pipeline"} · ${current?.name ?? ""}`}
        actions={
          <>
            {can("records:archive") && <Button variant="secondary" onClick={() => setArchiveOpen(true)}><Archive className="h-4 w-4" /> Archive</Button>}
            {canUpdate && <Button variant="secondary" onClick={() => setEdit(true)}><Pencil className="h-4 w-4" /> Edit</Button>}
            {canUpdate && d.status === "open" && (
              <>
                <Button variant="danger" onClick={() => setMode("lost")}><XCircle className="h-4 w-4" /> Lost</Button>
                <Button variant="success" onClick={() => setMode("won")}><Trophy className="h-4 w-4" /> Won</Button>
              </>
            )}
            {canUpdate && d.status !== "open" && openStages.length > 0 && (
              <Button variant="secondary" onClick={() => move.mutate({ stageId: openStages[openStages.length - 1]._id })} loading={move.isPending}>
                <RotateCcw className="h-4 w-4" /> Reopen
              </Button>
            )}
          </>
        }
      />

      <Card className="mb-6 p-2">
        <div className="flex overflow-x-auto scrollbar-thin">
          {openStages.map((s, i) => {
            const done = d.status === "won" || (d.status === "open" && i < currentIdx);
            const active = d.status === "open" && i === currentIdx;
            return (
              <button
                key={s._id}
                disabled={!canUpdate || active || move.isPending}
                onClick={() => move.mutate({ stageId: s._id })}
                className={cn(
                  "relative flex min-w-[120px] flex-1 items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold transition first:rounded-l-lg last:rounded-r-lg",
                  active ? "bg-brand-600 text-white" : done ? "bg-brand-50 text-brand-700" : "bg-slate-50 text-slate-500",
                  canUpdate && !active && "hover:bg-brand-100 hover:text-brand-800",
                  i > 0 && "ml-1",
                )}
              >
                {done && <Check className="h-3.5 w-3.5" />}
                {s.name}
                <span className={cn("font-normal", active ? "text-brand-100" : "text-slate-400")}>{s.probability}%</span>
              </button>
            );
          })}
          <div className={cn("ml-1 flex min-w-[120px] items-center justify-center rounded-lg px-4 py-2.5 text-xs font-semibold", d.status === "won" ? "bg-emerald-600 text-white" : d.status === "lost" ? "bg-rose-600 text-white" : "bg-slate-50 text-slate-400")}>
            {d.status === "lost" ? "Lost" : "Won"}
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Deal summary" />
            <div className="grid grid-cols-2 gap-px bg-line">
              <div className="bg-white p-4">
                <p className="text-xs text-slate-500">{d.status === "won" ? "Final amount" : "Value"}</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{formatMoney(d.status === "won" ? (d.finalAmount ?? d.value) : d.value, d.currency)}</p>
              </div>
              <div className="bg-white p-4">
                <p className="text-xs text-slate-500">Weighted</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{formatMoney(Math.round((d.value * d.probability) / 100), d.currency)}</p>
              </div>
            </div>
            <dl className="divide-y divide-line/60 px-5 py-2">
              <DetailRow label="Probability">{d.probability}%</DetailRow>
              <DetailRow label="Company">{d.companyId && <Link className="text-brand-600 hover:underline" href={`/companies/${d.companyId._id}`}>{d.companyId.name}</Link>}</DetailRow>
              <DetailRow label="Contact">{d.contactId && <Link className="text-brand-600 hover:underline" href={`/contacts/${d.contactId._id}`}>{fullName(d.contactId)}</Link>}</DetailRow>
              <DetailRow label="Owner"><span className="flex items-center gap-2"><Avatar name={d.ownerId?.name ?? "?"} size="xs" />{d.ownerId?.name}</span></DetailRow>
              <DetailRow label="Expected close">{d.expectedCloseDate ? formatDate(d.expectedCloseDate) : null}</DetailRow>
              {d.closedAt && <DetailRow label="Closed">{formatDate(d.closedAt)}</DetailRow>}
              {d.lostReason && <DetailRow label="Lost reason"><span className="text-rose-600">{d.lostReason}</span></DetailRow>}
              <DetailRow label="In stage since">{timeAgo(d.stageChangedAt)}</DetailRow>
              <DetailRow label="Created">{formatDate(d.createdAt)}</DetailRow>
            </dl>
          </Card>
          <Card>
            <CardHeader title="Stage history" />
            <ol className="space-y-3 px-5 py-4">
              {d.history.map((h) => (
                <li key={h._id} className="flex gap-3 text-sm">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-400" />
                  <div>
                    <p className="text-slate-800">{h.fromStageName ? <>{h.fromStageName} → <strong>{h.toStageName}</strong></> : <>Created in <strong>{h.toStageName}</strong></>}</p>
                    <p className="text-xs text-slate-500">{h.changedBy?.name} · {formatDateTime(h.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
          <RelatedTasks entityType="deal" entityId={d._id} name={d.title} />
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Timeline</h2>
          <Timeline entityType="deal" entityId={d._id} />
        </div>
      </div>

      <DealFormDialog open={edit} onOpenChange={setEdit} deal={d} />
      {mode && (
        <WonLostDialog
          mode={mode}
          open
          onOpenChange={(o) => !o && setMode(null)}
          defaultAmount={d.value}
          currency={d.currency}
          loading={move.isPending}
          onSubmit={(v) => move.mutate({ stageId: (mode === "won" ? wonStage : lostStage)?._id, ...v })}
        />
      )}
      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title="Archive deal?"
        description="Archived deals are removed from the board and reports."
        confirmLabel="Archive"
        onConfirm={() => archive.mutate()}
        loading={archive.isPending}
      />
    </div>
  );
}
