"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { AlertCircle, ArrowRight, BadgePercent, CircleDollarSign, Gauge, Target, Trophy, Wallet } from "lucide-react";
import { RevenueChart, SourceChart, StageChart, StatCard, type Overview } from "@/components/app/charts";
import { TaskRow } from "@/components/app/task-list";
import { ActivityItem } from "@/components/app/timeline";
import { Card, CardHeader, PageHeader, Skeleton } from "@/components/ui/primitives";
import { api } from "@/lib/api";
import { useCurrency, useSession } from "@/lib/hooks";
import type { Activity, Task } from "@/lib/types";
import { formatMoney, formatNumber } from "@/lib/utils";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const currency = useCurrency();
  const { data, isLoading } = useQuery({ queryKey: ["reports", "overview", "dashboard"], queryFn: () => api.get<Overview>("/reports/overview") });
  const tasks = useQuery({
    queryKey: ["tasks", "dashboard"],
    queryFn: () => api.list<Task>("/tasks", { view: "open", limit: 6, assignedTo: session?.user.id, tzOffset: new Date().getTimezoneOffset() }),
    enabled: !!session,
  });
  const k = data?.kpis;

  return (
    <div>
      <PageHeader
        title={`${greeting()}, ${session?.user.name.split(" ")[0] ?? ""}`}
        description={`Here's what's happening in ${session?.activeWorkspace?.name} over the last 30 days.`}
      />

      {isLoading || !k ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-[118px]" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Open pipeline" value={formatMoney(k.openPipelineValue, currency, true)} sub={`${k.openDeals} open deals`} icon={<Wallet className="h-4 w-4" />} />
          <StatCard label="Weighted forecast" value={formatMoney(k.weightedForecast, currency, true)} sub="Value × stage probability" icon={<Gauge className="h-4 w-4" />} accent="violet" />
          <StatCard label="Won revenue" value={formatMoney(k.wonRevenue, currency, true)} sub={`${k.wonDeals} deals won`} icon={<Trophy className="h-4 w-4" />} accent="emerald" />
          <StatCard label="Win rate" value={`${k.winRate}%`} sub={`${k.wonDeals} won · ${k.lostDeals} lost`} icon={<BadgePercent className="h-4 w-4" />} accent="sky" />
          <StatCard label="New leads" value={formatNumber(k.newLeads)} sub={`${formatNumber(k.totalLeads)} total · ${k.qualifiedLeads} qualified`} icon={<Target className="h-4 w-4" />} />
          <StatCard label="Lead conversion" value={`${k.conversionRate}%`} sub="Of leads created this period" icon={<ArrowRight className="h-4 w-4" />} accent="violet" />
          <StatCard label="Average deal value" value={formatMoney(k.averageDealValue, currency, true)} sub="Won deals" icon={<CircleDollarSign className="h-4 w-4" />} accent="emerald" />
          <StatCard
            label="Overdue tasks"
            value={k.overdueTasks}
            sub={<Link href="/tasks?view=overdue" className="text-brand-600 hover:underline">Review follow-ups →</Link>}
            icon={<AlertCircle className="h-4 w-4" />}
            accent={k.overdueTasks ? "rose" : "amber"}
          />
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Revenue" description="Won deal revenue over the last 6 months" />
          <div className="p-5">{data ? <RevenueChart data={data.revenueByMonth} currency={currency} /> : <Skeleton className="h-64" />}</div>
        </Card>
        <Card>
          <CardHeader title="Lead sources" description="Leads created in the last 30 days" />
          <div className="p-5">{data ? <SourceChart data={data.leadsBySource} /> : <Skeleton className="h-64" />}</div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Pipeline by stage" description={data?.pipeline ? `${data.pipeline.name} · open deals` : "Open deals"} action={<Link href="/deals" className="text-xs font-medium text-brand-600 hover:underline">Open board</Link>} />
          <div className="p-5">{data ? <StageChart data={data.dealsByStage} currency={currency} /> : <Skeleton className="h-64" />}</div>
        </Card>
        <Card>
          <CardHeader title="My open tasks" action={<Link href="/tasks" className="text-xs font-medium text-brand-600 hover:underline">View all</Link>} />
          {tasks.data?.data.length ? (
            <div className="divide-y divide-line/70">
              {tasks.data.data.map((t) => (
                <TaskRow key={t._id} task={t} />
              ))}
            </div>
          ) : (
            <p className="px-5 py-10 text-center text-sm text-slate-500">{tasks.isLoading ? "Loading…" : "No open tasks. Nice work!"}</p>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Recent activity" />
          <div className="p-5">
            {data?.recentActivity.length ? (
              <ul>
                {data.recentActivity.map((a) => (
                  <ActivityItem key={a._id} a={a as unknown as Activity} />
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-sm text-slate-500">Activity from your team will appear here.</p>
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title="Top performers" description="Won revenue, last 30 days" />
          <div className="p-5">
            {data?.topPerformers.length ? (
              <ol className="space-y-4">
                {data.topPerformers.map((p, i) => {
                  const max = data.topPerformers[0].revenue || 1;
                  return (
                    <li key={p.userId}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-800">
                          <span className="mr-2 text-slate-400">{i + 1}</span>
                          {p.name}
                        </span>
                        <span className="text-slate-600">{formatMoney(p.revenue, currency, true)}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-500" style={{ width: `${(p.revenue / max) * 100}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="py-6 text-center text-sm text-slate-500">Rankings appear after deals are won.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
