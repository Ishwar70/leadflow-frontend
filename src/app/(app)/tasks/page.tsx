"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CheckSquare, Plus } from "lucide-react";
import { TaskFormDialog } from "@/components/app/forms";
import { MemberSelect } from "@/components/app/pickers";
import { TaskRow } from "@/components/app/task-list";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { Card, EmptyState, PageHeader, Pagination, Skeleton, Tabs } from "@/components/ui/primitives";
import { api } from "@/lib/api";
import { PRIORITIES } from "@/lib/constants";
import { useCan, useInitialParam, useResettingPage } from "@/lib/hooks";
import type { Task } from "@/lib/types";

const VIEWS = ["today", "overdue", "upcoming", "open", "completed"] as const;
type View = (typeof VIEWS)[number];
const LABELS: Record<View, string> = { today: "Today", overdue: "Overdue", upcoming: "Upcoming", open: "All open", completed: "Completed" };
const EMPTY: Record<View, string> = {
  today: "Nothing due today. Enjoy the clear runway.",
  overdue: "No overdue tasks — you're on top of every follow-up.",
  upcoming: "No upcoming tasks scheduled.",
  open: "No open tasks.",
  completed: "Completed tasks will appear here.",
};

export default function TasksPage() {
  const can = useCan();
  const [view, setView] = useState<View>("today");
  const [assignedTo, setAssignedTo] = useState("");
  const [priority, setPriority] = useState("");
  const [page, setPage] = useResettingPage(`${view}|${assignedTo}|${priority}`);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | undefined>();
  useInitialParam("view", (v) => VIEWS.includes(v as View) && setView(v as View));

  const tzOffset = new Date().getTimezoneOffset();
  const { data, isLoading } = useQuery({
    queryKey: ["tasks", view, assignedTo, priority, page],
    queryFn: () => api.list<Task>("/tasks", { view, assignedTo, priority, page, limit: 25, tzOffset }),
    placeholderData: keepPreviousData,
  });
  const { data: counts } = useQuery({ queryKey: ["task-counts"], queryFn: () => api.get<{ open: number; overdue: number }>("/tasks/counts") });

  return (
    <div>
      <PageHeader
        title="Tasks"
        description={counts ? `${counts.open} open · ${counts.overdue} overdue` : "Every follow-up, call and meeting in one place."}
        actions={
          can("records:create") && (
            <Button
              onClick={() => {
                setEditing(undefined);
                setOpen(true);
              }}
            >
              <Plus className="h-4 w-4" /> New task
            </Button>
          )
        }
      />
      <Card>
        <div className="flex flex-wrap items-end justify-between gap-3 px-4 pt-2">
          <Tabs
            value={view}
            onChange={setView}
            className="border-b-0"
            items={VIEWS.map((v) => ({
              value: v,
              label: LABELS[v],
              count: v === "overdue" ? counts?.overdue : v === "open" ? counts?.open : undefined,
            }))}
          />
          <div className="flex gap-2 pb-2">
            {can("records:read_all") && <MemberSelect includeAll allLabel="All assignees" value={assignedTo} onChange={setAssignedTo} className="w-44" />}
            <Select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-36">
              <option value="">Any priority</option>
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </Select>
          </div>
        </div>
        <div className="border-t border-line">
          {isLoading ? (
            <div className="space-y-3 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : !data?.data.length ? (
            <EmptyState icon={<CheckSquare className="h-5 w-5" />} title={`No ${LABELS[view].toLowerCase()} tasks`} description={EMPTY[view]} />
          ) : (
            <div className="divide-y divide-line/70">
              {data.data.map((t) => (
                <TaskRow
                  key={t._id}
                  task={t}
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
        </div>
        {data && <Pagination page={data.meta.page} pages={data.meta.pages} total={data.meta.total} onChange={setPage} label="tasks" />}
      </Card>
      <TaskFormDialog open={open} onOpenChange={setOpen} task={editing} />
    </div>
  );
}
