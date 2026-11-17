"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { CalendarClock, Circle, CircleCheck, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/primitives";
import { api, errorMessage } from "@/lib/api";
import { useCan } from "@/lib/hooks";
import type { EntityType, Task } from "@/lib/types";
import { cn, formatDateTime, labelize } from "@/lib/utils";
import { PriorityBadge } from "./badges";
import { TaskFormDialog } from "./forms";

export function TaskRow({ task, showRelated = true, onEdit }: { task: Task; showRelated?: boolean; onEdit?: () => void }) {
  const qc = useQueryClient();
  const can = useCan();
  const toggle = useMutation({
    mutationFn: () => api.patch(`/tasks/${task._id}/${task.status === "open" ? "complete" : "reopen"}`),
    onSuccess: () => {
      if (task.status === "open") toast.success("Task completed");
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["task-counts"] });
      qc.invalidateQueries({ queryKey: ["activities"] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
  const overdue = task.status === "open" && new Date(task.dueAt) < new Date();
  const done = task.status === "completed";
  const href = task.relatedType && task.relatedId ? `/${task.relatedType === "company" ? "companies" : `${task.relatedType}s`}/${task.relatedId}` : null;

  return (
    <div className="group flex items-start gap-3 px-4 py-3 transition hover:bg-slate-50/70">
      <button
        disabled={!can("records:update") || toggle.isPending}
        onClick={() => toggle.mutate()}
        className={cn("mt-0.5 shrink-0 text-slate-300 transition hover:text-emerald-500 disabled:cursor-not-allowed", done && "text-emerald-500")}
        aria-label={done ? "Reopen task" : "Complete task"}
      >
        {done ? <CircleCheck className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
      </button>
      <div className="min-w-0 flex-1">
        <button onClick={onEdit} disabled={!onEdit} className={cn("block text-left text-sm font-medium text-slate-800", done && "text-slate-400 line-through", onEdit && "hover:text-brand-700")}>
          {task.title}
        </button>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          <span className={cn("inline-flex items-center gap-1", overdue && "font-medium text-rose-600")}>
            <CalendarClock className="h-3.5 w-3.5" />
            {overdue ? "Overdue · " : ""}
            {formatDateTime(task.dueAt)}
          </span>
          <span>{labelize(task.type)}</span>
          {showRelated && href && (
            <Link href={href} className="truncate text-brand-600 hover:underline">
              {task.relatedName}
            </Link>
          )}
          {task.assignedTo?.name && <span>· {task.assignedTo.name}</span>}
        </div>
      </div>
      <PriorityBadge priority={task.priority} />
    </div>
  );
}

export function RelatedTasks({ entityType, entityId, name }: { entityType: EntityType; entityId: string; name: string }) {
  const can = useCan();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | undefined>();
  const { data } = useQuery({
    queryKey: ["tasks", "related", entityType, entityId],
    queryFn: () => api.list<Task>("/tasks", { relatedType: entityType, relatedId: entityId, view: "all", limit: 50 }),
  });
  const tasks = (data?.data ?? []).sort((a, b) => (a.status === b.status ? +new Date(a.dueAt) - +new Date(b.dueAt) : a.status === "open" ? -1 : 1));
  return (
    <Card>
      <CardHeader
        title="Tasks"
        description={`${tasks.filter((t) => t.status === "open").length} open`}
        action={
          can("records:create") && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setEditing(undefined);
                setOpen(true);
              }}
            >
              <Plus className="h-3.5 w-3.5" /> Task
            </Button>
          )
        }
      />
      {tasks.length === 0 ? (
        <p className="px-5 py-6 text-center text-sm text-slate-500">No tasks yet.</p>
      ) : (
        <div className="divide-y divide-line/70">
          {tasks.map((t) => (
            <TaskRow
              key={t._id}
              task={t}
              showRelated={false}
              onEdit={
                can("records:update")
                  ? () => {
                      setEditing(t);
                      setOpen(true);
                    }
                  : undefined
              }
            />
          ))}
        </div>
      )}
      <TaskFormDialog open={open} onOpenChange={setOpen} task={editing} related={editing ? undefined : { type: entityType, id: entityId, name }} />
    </Card>
  );
}
