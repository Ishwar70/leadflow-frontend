"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ReactNode } from "react";
import { TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/primitives";
import { LEAD_SOURCES, SOURCE_COLORS } from "@/lib/constants";
import { cn, formatMoney } from "@/lib/utils";

export interface Overview {
  range: { from: string; to: string };
  kpis: {
    totalLeads: number;
    newLeads: number;
    qualifiedLeads: number;
    conversionRate: number;
    openPipelineValue: number;
    openDeals: number;
    weightedForecast: number;
    wonRevenue: number;
    wonDeals: number;
    lostDeals: number;
    winRate: number;
    averageDealValue: number;
    overdueTasks: number;
  };
  leadsBySource: Array<{ source: string; count: number }>;
  dealsByStage: Array<{ stage: string; color: string; count: number; value: number }>;
  revenueByMonth: Array<{ month: string; revenue: number; deals: number }>;
  topPerformers: Array<{ userId: string; name: string; revenue: number; deals: number }>;
  recentActivity: Array<{ _id: string; type: string; summary: string; actorId: { name: string } | null; occurredAt: string; body: string; isSystem: boolean; links: never[] }>;
  pipeline: { _id: string; name: string } | null;
}

export function StatCard({ label, value, sub, icon, accent = "brand", className }: { label: string; value: ReactNode; sub?: ReactNode; icon: ReactNode; accent?: "brand" | "emerald" | "amber" | "rose" | "sky" | "violet"; className?: string }) {
  const accents = {
    brand: "bg-brand-50 text-brand-600 ring-brand-100",
    emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    amber: "bg-amber-50 text-amber-600 ring-amber-100",
    rose: "bg-rose-50 text-rose-600 ring-rose-100",
    sky: "bg-sky-50 text-sky-600 ring-sky-100",
    violet: "bg-violet-50 text-violet-600 ring-violet-100",
  };
  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-start justify-between">
        <p className="text-[13px] font-medium text-slate-500">{label}</p>
        <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg ring-1", accents[accent])}>{icon}</span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </Card>
  );
}

const tooltipStyle = {
  contentStyle: { borderRadius: 10, border: "1px solid #e6e8f0", boxShadow: "0 12px 32px -8px rgb(16 24 40 / 0.18)", fontSize: 12 },
  labelStyle: { color: "#0f172a", fontWeight: 600 },
};

export function RevenueChart({ data, currency }: { data: Overview["revenueByMonth"]; currency: string }) {
  const empty = data.every((d) => d.revenue === 0);
  return (
    <div className="h-64">
      {empty ? (
        <EmptyChart text="Won revenue appears here once deals are marked Won." />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6c63f1" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#6c63f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef0f5" vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
            <YAxis tickLine={false} axisLine={false} width={64} tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={(v) => formatMoney(v, currency, true)} />
            <Tooltip {...tooltipStyle} formatter={(v) => [formatMoney(Number(v), currency), "Won revenue"]} />
            <Area type="monotone" dataKey="revenue" stroke="#5b4ae4" strokeWidth={2.2} fill="url(#rev)" />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export function StageChart({ data, currency }: { data: Overview["dealsByStage"]; currency: string }) {
  const empty = data.every((d) => d.count === 0);
  return (
    <div className="h-64">
      {empty ? (
        <EmptyChart text="Open deals by stage appear here." />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef0f5" vertical={false} />
            <XAxis dataKey="stage" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
            <YAxis tickLine={false} axisLine={false} width={64} tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={(v) => formatMoney(v, currency, true)} />
            <Tooltip
              {...tooltipStyle}
              cursor={{ fill: "#f4f5fa" }}
              formatter={(v, _n, item) => [`${formatMoney(Number(v), currency)} · ${(item?.payload as { count: number }).count} deals`, "Pipeline value"]}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
              {data.map((d) => (
                <Cell key={d.stage} fill={d.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export function SourceChart({ data }: { data: Overview["leadsBySource"] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (!total) return <div className="h-64"><EmptyChart text="Lead sources appear once leads are captured in this period." /></div>;
  return (
    <div className="flex h-64 items-center gap-4">
      <div className="relative h-full w-1/2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="count" nameKey="source" innerRadius="62%" outerRadius="92%" paddingAngle={2} stroke="none">
              {data.map((d) => (
                <Cell key={d.source} fill={SOURCE_COLORS[d.source] ?? "#94a3b8"} />
              ))}
            </Pie>
            <Tooltip {...tooltipStyle} formatter={(v, n) => [v, LEAD_SOURCES.find((s) => s.value === n)?.label ?? n]} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-semibold text-slate-900">{total}</span>
          <span className="text-[11px] text-slate-500">leads</span>
        </div>
      </div>
      <ul className="flex-1 space-y-2">
        {data.map((d) => (
          <li key={d.source} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: SOURCE_COLORS[d.source] ?? "#94a3b8" }} />
            <span className="flex-1 text-slate-600">{LEAD_SOURCES.find((s) => s.value === d.source)?.label ?? d.source}</span>
            <span className="font-medium text-slate-900">{d.count}</span>
            <span className="w-10 text-right text-xs text-slate-400">{Math.round((d.count / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function EmptyChart({ text }: { text: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-lg border border-dashed border-line bg-slate-50/50 text-center">
      <TrendingUp className="h-6 w-6 text-slate-300" />
      <p className="mt-2 max-w-xs text-xs text-slate-500">{text}</p>
    </div>
  );
}
