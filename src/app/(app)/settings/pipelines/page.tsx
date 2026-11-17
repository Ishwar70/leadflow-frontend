"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, GitBranch, Lock, Plus, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/form";
import { Badge, Card, CardHeader, EmptyState, PageHeader, Skeleton } from "@/components/ui/primitives";
import { api, errorMessage } from "@/lib/api";
import { useCan, usePipelines } from "@/lib/hooks";
import type { Pipeline, Stage } from "@/lib/types";
import { cn } from "@/lib/utils";

type DraftStage = Omit<Stage, "_id" | "order"> & { _id?: string; key: string };
const COLORS = ["#6366f1", "#8b5cf6", "#0ea5e9", "#14b8a6", "#f59e0b", "#f97316", "#ec4899", "#10b981", "#ef4444", "#64748b"];

let keySeq = 0;
const toDraft = (p: Pipeline): DraftStage[] => p.stages.map((s) => ({ _id: s._id, key: s._id, name: s.name, probability: s.probability, type: s.type, color: s.color }));
const toPayload = (stages: DraftStage[]) => stages.map((s) => ({ _id: s._id, name: s.name, probability: s.probability, type: s.type, color: s.color }));

function validate(stages: DraftStage[]) {
  if (stages.some((s) => !s.name.trim())) return "Every stage needs a name";
  if (stages.filter((s) => s.type === "won").length !== 1) return "Exactly one Won stage is required";
  if (stages.filter((s) => s.type === "lost").length !== 1) return "Exactly one Lost stage is required";
  if (!stages.some((s) => s.type === "open")) return "At least one open stage is required";
  return null;
}

function Editor({ pipeline, canEdit, onlyOne }: { pipeline: Pipeline; canEdit: boolean; onlyOne: boolean }) {
  const qc = useQueryClient();
  const [name, setName] = useState(pipeline.name);
  const [stages, setStages] = useState<DraftStage[]>(() => toDraft(pipeline));
  const [confirmDelete, setConfirmDelete] = useState(false);

  const dirty = name !== pipeline.name || JSON.stringify(toPayload(stages)) !== JSON.stringify(toPayload(toDraft(pipeline)));
  const problem = validate(stages);
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["pipelines"] });
    qc.invalidateQueries({ queryKey: ["board"] });
  };

  const save = useMutation({
    mutationFn: () => api.patch(`/pipelines/${pipeline._id}`, { name, stages: toPayload(stages) }),
    onSuccess: () => {
      toast.success("Pipeline saved");
      invalidate();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
  const makeDefault = useMutation({
    mutationFn: () => api.post(`/pipelines/${pipeline._id}/default`),
    onSuccess: () => {
      toast.success(`${pipeline.name} is now the default pipeline`);
      invalidate();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
  const remove = useMutation({
    mutationFn: () => api.del(`/pipelines/${pipeline._id}`),
    onSuccess: () => {
      toast.success("Pipeline deleted");
      setConfirmDelete(false);
      invalidate();
    },
    onError: (err) => {
      setConfirmDelete(false);
      toast.error(errorMessage(err));
    },
  });

  const update = (i: number, patch: Partial<DraftStage>) => setStages((s) => s.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const moveStage = (i: number, dir: -1 | 1) =>
    setStages((s) => {
      const next = [...s];
      [next[i], next[i + dir]] = [next[i + dir], next[i]];
      return next;
    });
  const addStage = () =>
    setStages((s) => {
      const firstClosed = s.findIndex((x) => x.type !== "open");
      const at = firstClosed === -1 ? s.length : firstClosed;
      const stage: DraftStage = { key: `new-${++keySeq}`, name: "New stage", probability: 50, type: "open", color: COLORS[s.length % COLORS.length] };
      return [...s.slice(0, at), stage, ...s.slice(at)];
    });

  return (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            {pipeline.name}
            {pipeline.isDefault && <Badge tone="brand"><Star className="h-3 w-3" /> Default</Badge>}
          </span>
        }
        description={`${pipeline.stages.length} stages`}
        action={
          canEdit && (
            <div className="flex gap-2">
              {!pipeline.isDefault && <Button size="sm" variant="secondary" onClick={() => makeDefault.mutate()} loading={makeDefault.isPending}>Set default</Button>}
              {!onlyOne && <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(true)} aria-label="Delete pipeline"><Trash2 className="h-4 w-4 text-rose-500" /></Button>}
            </div>
          )
        }
      />
      <div className="space-y-4 p-5">
        <Field label="Pipeline name">
          <Input value={name} onChange={(e) => setName(e.target.value)} disabled={!canEdit} className="max-w-sm" />
        </Field>
        <div className="overflow-x-auto scrollbar-thin">
          <div className="min-w-[640px] space-y-2">
            <div className="grid grid-cols-[28px_1fr_110px_120px_150px_72px] gap-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <span />
              <span>Stage</span>
              <span>Probability</span>
              <span>Type</span>
              <span>Color</span>
              <span />
            </div>
            {stages.map((s, i) => (
              <div key={s.key} className="grid grid-cols-[28px_1fr_110px_120px_150px_72px] items-center gap-2 rounded-lg border border-line bg-white p-1.5">
                <span className="text-center text-xs font-medium text-slate-400">{i + 1}</span>
                <Input value={s.name} onChange={(e) => update(i, { name: e.target.value })} disabled={!canEdit} className="h-8" />
                <div className="relative">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={s.probability}
                    onChange={(e) => update(i, { probability: Math.max(0, Math.min(100, Number(e.target.value))) })}
                    disabled={!canEdit}
                    className="h-8 pr-7"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                </div>
                <Select
                  value={s.type}
                  onChange={(e) => {
                    const type = e.target.value as Stage["type"];
                    update(i, { type, probability: type === "won" ? 100 : type === "lost" ? 0 : s.probability });
                  }}
                  disabled={!canEdit}
                  className="h-8 text-xs"
                >
                  <option value="open">Open</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </Select>
                <div className="flex gap-1">
                  {COLORS.slice(0, 5).map((c) => (
                    <button
                      key={c}
                      type="button"
                      disabled={!canEdit}
                      onClick={() => update(i, { color: c })}
                      className={cn("h-5 w-5 rounded-full ring-offset-2 transition", s.color === c && "ring-2 ring-slate-400")}
                      style={{ background: c }}
                      aria-label={`Color ${c}`}
                    />
                  ))}
                  <input type="color" value={s.color} disabled={!canEdit} onChange={(e) => update(i, { color: e.target.value })} className="h-5 w-5 cursor-pointer rounded-full border-0 bg-transparent p-0" aria-label="Custom color" />
                </div>
                <div className="flex justify-end gap-0.5">
                  {canEdit ? (
                    <>
                      <button type="button" disabled={i === 0} onClick={() => moveStage(i, -1)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30" aria-label="Move up"><ArrowUp className="h-3.5 w-3.5" /></button>
                      <button type="button" disabled={i === stages.length - 1} onClick={() => moveStage(i, 1)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30" aria-label="Move down"><ArrowDown className="h-3.5 w-3.5" /></button>
                      <button type="button" disabled={stages.length <= 2} onClick={() => setStages((x) => x.filter((_, j) => j !== i))} className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30" aria-label="Remove stage"><Trash2 className="h-3.5 w-3.5" /></button>
                    </>
                  ) : (
                    <Lock className="h-3.5 w-3.5 text-slate-300" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        {canEdit && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button variant="secondary" size="sm" onClick={addStage} disabled={stages.length >= 15}><Plus className="h-3.5 w-3.5" /> Add stage</Button>
            <div className="flex items-center gap-3">
              {problem ? <span className="text-xs text-rose-600">{problem}</span> : dirty && <span className="text-xs text-slate-500">Unsaved changes</span>}
              {dirty && <Button variant="ghost" size="sm" onClick={() => { setName(pipeline.name); setStages(toDraft(pipeline)); }}>Discard</Button>}
              <Button size="sm" disabled={!dirty || !!problem || !name.trim()} loading={save.isPending} onClick={() => save.mutate()}>Save pipeline</Button>
            </div>
          </div>
        )}
        <p className="text-xs text-slate-500">Stages that contain deals can&apos;t be removed — move those deals first. Probability drives the weighted forecast.</p>
      </div>
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete pipeline?"
        description="Pipelines that still contain deals can't be deleted."
        confirmLabel="Delete"
        onConfirm={() => remove.mutate()}
        loading={remove.isPending}
      />
    </Card>
  );
}

export default function PipelinesPage() {
  const qc = useQueryClient();
  const can = useCan();
  const canEdit = can("pipeline:configure");
  const { data: pipelines, isLoading } = usePipelines();
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const create = useMutation({
    mutationFn: () => api.post<Pipeline>("/pipelines", { name: newName }),
    onSuccess: () => {
      toast.success("Pipeline created with default stages");
      setCreateOpen(false);
      setNewName("");
      qc.invalidateQueries({ queryKey: ["pipelines"] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Pipelines"
        description="Configure the stages deals move through. Each pipeline has exactly one Won and one Lost stage."
        actions={canEdit && <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> New pipeline</Button>}
      />
      {isLoading ? (
        <Skeleton className="h-96" />
      ) : !pipelines?.length ? (
        <Card><EmptyState icon={<GitBranch className="h-5 w-5" />} title="No pipelines yet" /></Card>
      ) : (
        <div className="space-y-6">
          {pipelines.map((p) => (
            <Editor key={`${p._id}:${p.name}:${JSON.stringify(p.stages)}`} pipeline={p} canEdit={canEdit} onlyOne={pipelines.length === 1} />
          ))}
        </div>
      )}
      <Dialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        size="sm"
        title="New pipeline"
        description="It starts with the standard stages, which you can then customise."
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={() => create.mutate()} disabled={!newName.trim()} loading={create.isPending}>Create</Button>
          </>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (newName.trim()) create.mutate();
          }}
        >
          <Field label="Pipeline name" required>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Partnerships" autoFocus />
          </Field>
        </form>
      </Dialog>
    </div>
  );
}
