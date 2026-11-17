"use client";

import { DndContext, DragOverlay, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, Clock, KanbanSquare, Plus, Search } from "lucide-react";
import { DealFormDialog } from "@/components/app/forms";
import { MemberSelect } from "@/components/app/pickers";
import { WonLostDialog } from "@/components/app/won-lost-dialog";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { Avatar, Badge, EmptyState, PageHeader, Skeleton } from "@/components/ui/primitives";
import { api, errorMessage } from "@/lib/api";
import { STALE_DAYS } from "@/lib/constants";
import { useCan, useCurrency, useDebounced, usePipelines } from "@/lib/hooks";
import type { Deal, Pipeline, Stage } from "@/lib/types";
import { cn, formatDate, formatMoney } from "@/lib/utils";

interface Board {
  pipeline: Pipeline;
  deals: Deal[];
}

function isStale(d: Deal) {
  return d.status === "open" && Date.now() - new Date(d.stageChangedAt).getTime() > STALE_DAYS * 86400000;
}

function DealCard({ deal, dragging, currency }: { deal: Deal; dragging?: boolean; currency: string }) {
  const stale = isStale(deal);
  return (
    <div
      className={cn(
        "rounded-xl border border-line bg-white p-3 shadow-card transition",
        dragging ? "rotate-[1.5deg] shadow-pop ring-2 ring-brand-300" : "hover:border-brand-200 hover:shadow-md",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="line-clamp-2 text-sm font-medium leading-snug text-slate-900">{deal.title}</p>
        <Avatar name={deal.ownerId?.name ?? "?"} size="xs" className="mt-0.5" />
      </div>
      {deal.companyId && <p className="mt-1 truncate text-xs text-slate-500">{deal.companyId.name}</p>}
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-slate-900">{formatMoney(deal.status === "won" ? (deal.finalAmount ?? deal.value) : deal.value, deal.currency || currency, true)}</span>
        <span className="text-[11px] font-medium text-slate-400">{deal.probability}%</span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {deal.expectedCloseDate && deal.status === "open" && (
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
            <CalendarDays className="h-3 w-3" /> {formatDate(deal.expectedCloseDate, "d MMM")}
          </span>
        )}
        {stale && (
          <Badge tone="amber" className="text-[10px]">
            <Clock className="h-3 w-3" /> Stale
          </Badge>
        )}
        {deal.status === "lost" && deal.lostReason && <span className="truncate text-[11px] text-rose-600">{deal.lostReason}</span>}
      </div>
    </div>
  );
}

function DraggableDeal({ deal, currency, disabled }: { deal: Deal; currency: string; disabled: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: deal._id, disabled });
  return (
    <Link href={`/deals/${deal._id}`} ref={setNodeRef} {...listeners} {...attributes} className={cn("block touch-none", isDragging && "opacity-30")}>
      <DealCard deal={deal} currency={currency} />
    </Link>
  );
}

function Column({ stage, deals, currency, canMove, onAdd }: { stage: Stage; deals: Deal[]; currency: string; canMove: boolean; onAdd?: () => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage._id });
  const total = deals.reduce((s, d) => s + (d.status === "won" ? (d.finalAmount ?? d.value) : d.value), 0);
  return (
    <div className="flex w-[290px] shrink-0 flex-col">
      <div className="mb-3 flex items-center gap-2 px-1">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: stage.color }} />
        <h3 className="text-sm font-semibold text-slate-800">{stage.name}</h3>
        <span className="rounded-full bg-slate-200/70 px-1.5 text-[11px] font-semibold text-slate-600">{deals.length}</span>
        <span className="ml-auto text-xs font-medium text-slate-500">{formatMoney(total, currency, true)}</span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[200px] flex-1 flex-col gap-2.5 rounded-2xl border p-2.5 transition-colors",
          isOver ? "border-brand-300 bg-brand-50/70" : stage.type === "won" ? "border-emerald-100 bg-emerald-50/40" : stage.type === "lost" ? "border-rose-100 bg-rose-50/30" : "border-line/70 bg-slate-100/50",
        )}
      >
        {deals.map((d) => (
          <DraggableDeal key={d._id} deal={d} currency={currency} disabled={!canMove} />
        ))}
        {deals.length === 0 && <p className="py-6 text-center text-xs text-slate-400">{stage.type === "open" ? "Drop deals here" : stage.type === "won" ? "Won deals (90 days)" : "Lost deals (90 days)"}</p>}
        {onAdd && stage.type === "open" && (
          <button onClick={onAdd} className="flex items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-medium text-slate-400 transition hover:bg-white hover:text-brand-600">
            <Plus className="h-3.5 w-3.5" /> Add deal
          </button>
        )}
      </div>
    </div>
  );
}

export default function DealsPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const can = useCan();
  const currency = useCurrency();
  const { data: pipelines } = usePipelines();
  const [pipelineId, setPipelineId] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [q, setQ] = useState("");
  const dq = useDebounced(q);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pending, setPending] = useState<{ deal: Deal; stage: Stage } | null>(null);
  const [createStage, setCreateStage] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const key = ["board", pipelineId, ownerId, dq];

  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: () => api.get<Board>("/deals/board", { pipelineId, ownerId, q: dq }),
    placeholderData: (p) => p,
  });

  const move = useMutation({
    mutationFn: (v: { dealId: string; stageId: string; finalAmount?: number; closedAt?: string; lostReason?: string }) =>
      api.patch<Deal>(`/deals/${v.dealId}/stage`, v),
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Board>(key);
      const stage = prev?.pipeline.stages.find((s) => s._id === v.stageId);
      if (prev && stage) {
        qc.setQueryData<Board>(key, {
          ...prev,
          deals: prev.deals.map((d) =>
            d._id === v.dealId
              ? { ...d, stageId: v.stageId, probability: stage.probability, status: stage.type, stageChangedAt: new Date().toISOString(), finalAmount: v.finalAmount ?? d.finalAmount, lostReason: v.lostReason ?? d.lostReason }
              : d,
          ),
        });
      }
      return { prev };
    },
    onError: (err, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
      toast.error(errorMessage(err));
    },
    onSuccess: (_d, v) => {
      const stage = data?.pipeline.stages.find((s) => s._id === v.stageId);
      if (stage?.type === "won") toast.success("Deal won! 🎉");
      setPending(null);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["board"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });

  const byStage = useMemo(() => {
    const map: Record<string, Deal[]> = {};
    data?.pipeline.stages.forEach((s) => (map[s._id] = []));
    data?.deals.forEach((d) => map[d.stageId]?.push(d));
    return map;
  }, [data]);

  const totals = useMemo(() => {
    const open = data?.deals.filter((d) => d.status === "open") ?? [];
    return {
      count: open.length,
      value: open.reduce((s, d) => s + d.value, 0),
      weighted: Math.round(open.reduce((s, d) => s + (d.value * d.probability) / 100, 0)),
    };
  }, [data]);

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    if (!e.over || !data) return;
    const deal = data.deals.find((d) => d._id === e.active.id);
    const stage = data.pipeline.stages.find((s) => s._id === e.over!.id);
    if (!deal || !stage || deal.stageId === stage._id) return;
    if (stage.type === "won" || stage.type === "lost") setPending({ deal, stage });
    else move.mutate({ dealId: deal._id, stageId: stage._id });
  };
  const activeDeal = data?.deals.find((d) => d._id === activeId);

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Deals"
        description={
          data ? (
            <span>
              {totals.count} open deals · <span className="font-medium text-slate-700">{formatMoney(totals.value, currency)}</span> pipeline ·{" "}
              <span className="font-medium text-slate-700">{formatMoney(totals.weighted, currency)}</span> weighted
            </span>
          ) : (
            "Drag deals across stages to update your pipeline."
          )
        }
        actions={can("records:create") && <Button onClick={() => setCreateStage("")}><Plus className="h-4 w-4" /> New deal</Button>}
      />
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Select value={pipelineId || data?.pipeline._id || ""} onChange={(e) => setPipelineId(e.target.value)} className="w-52">
          {pipelines?.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
        </Select>
        {can("records:read_all") && <MemberSelect includeAll value={ownerId} onChange={setOwnerId} className="w-44" />}
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter deals" className="pl-9" />
        </div>
        {!can("records:update") && <Badge tone="slate">Read-only</Badge>}
      </div>

      {isLoading || !data ? (
        <div className="flex gap-4 overflow-hidden">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-[480px] w-[290px] shrink-0 rounded-2xl" />)}</div>
      ) : data.deals.length === 0 && !dq && !ownerId ? (
        <div className="rounded-2xl border border-line bg-white">
          <EmptyState
            icon={<KanbanSquare className="h-5 w-5" />}
            title="No deals in this pipeline"
            description="Convert a qualified lead into a deal, or create one directly to start tracking revenue."
            action={
              <div className="flex gap-2">
                <Link href="/leads?status=qualified"><Button variant="secondary">View qualified leads</Button></Link>
                {can("records:create") && <Button onClick={() => setCreateStage("")}>Create deal</Button>}
              </div>
            }
          />
        </div>
      ) : (
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setActiveId(null)}>
          <div className="-mx-4 flex flex-1 gap-4 overflow-x-auto px-4 pb-4 scrollbar-thin sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
            {data.pipeline.stages.map((s) => (
              <Column key={s._id} stage={s} deals={byStage[s._id] ?? []} currency={currency} canMove={can("records:update")} onAdd={can("records:create") ? () => setCreateStage(s._id) : undefined} />
            ))}
          </div>
          <DragOverlay>{activeDeal && <DealCard deal={activeDeal} dragging currency={currency} />}</DragOverlay>
        </DndContext>
      )}

      {pending && (
        <WonLostDialog
          mode={pending.stage.type as "won" | "lost"}
          open
          onOpenChange={(o) => !o && setPending(null)}
          defaultAmount={pending.deal.value}
          currency={pending.deal.currency || currency}
          loading={move.isPending}
          onSubmit={(v) => move.mutate({ dealId: pending.deal._id, stageId: pending.stage._id, ...v })}
        />
      )}
      <DealFormDialog
        open={createStage !== null}
        onOpenChange={(o) => !o && setCreateStage(null)}
        defaults={{ pipelineId: data?.pipeline._id, stageId: createStage || undefined }}
        onSaved={(d) => router.push(`/deals/${d._id}`)}
      />
    </div>
  );
}
