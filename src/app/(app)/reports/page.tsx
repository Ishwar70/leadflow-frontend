"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { BadgePercent, CircleDollarSign, Gauge, Target, Trophy, Wallet } from "lucide-react";
import { RevenueChart, SourceChart, StageChart, StatCard, type Overview } from "@/components/app/charts";
import { MemberSelect } from "@/components/app/pickers";
import { Select } from "@/components/ui/form";
import { Card, CardHeader, PageHeader, Skeleton, Table, Td, Th } from "@/components/ui/primitives";
import { api } from "@/lib/api";
import { LEAD_SOURCES } from "@/lib/constants";
import { useCan, useCurrency, usePipelines } from "@/lib/hooks";
import { formatDate, formatMoney, formatNumber } from "@/lib/utils";

const RANGES = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "180", label: "Last 6 months" },
  { value: "365", label: "Last 12 months" },
];

export default function ReportsPage() {
  const currency = useCurrency();
  const can = useCan();
  const { data: pipelines } = usePipelines();
  const [range, setRange] = useState("90");
  const [ownerId, setOwnerId] = useState("");
  const [source, setSource] = useState("");
  const [pipelineId, setPipelineId] = useState("");
  const params = useMemo(() => {
    const to = new Date();
    const from = new Date(to.getTime() - Number(range) * 86400000);
    return { from: from.toISOString(), to: to.toISOString(), ownerId, source, pipelineId };
  }, [range, ownerId, source, pipelineId]);
  const { data, isFetching } = useQuery({
    queryKey: ["reports", "overview", params],
    queryFn: () => api.get<Overview>("/reports/overview", params),
    placeholderData: (p) => p,
  });
  const k = data?.kpis;

  return (
    <div>
      <PageHeader
        title="Reports"
        description={can("records:read_all") ? "Performance across your workspace, calculated live from stored data." : "Your personal performance, calculated live from your records."}
        actions={isFetching && <span className="text-xs text-slate-400">Updating…</span>}
      />
      <Card className="mb-6 flex flex-wrap items-center gap-3 p-3">
        <Select value={range} onChange={(e) => setRange(e.target.value)} className="w-40">
          {RANGES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </Select>
        {can("records:read_all") && <MemberSelect includeAll value={ownerId} onChange={setOwnerId} className="w-44" />}
        <Select value={source} onChange={(e) => setSource(e.target.value)} className="w-40">
          <option value="">All sources</option>
          {LEAD_SOURCES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </Select>
        <Select value={pipelineId} onChange={(e) => setPipelineId(e.target.value)} className="w-48">
          <option value="">All pipelines</option>
          {pipelines?.map((p) => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </Select>
        {data && <span className="ml-auto text-xs text-slate-500">{formatDate(data.range.from)} – {formatDate(data.range.to)}</span>}
      </Card>

      {!k ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[118px]" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard label="Won revenue" value={formatMoney(k.wonRevenue, currency)} sub={`${k.wonDeals} deals closed won`} icon={<Trophy className="h-4 w-4" />} accent="emerald" />
          <StatCard label="Win rate" value={`${k.winRate}%`} sub={`won / (won + lost) · ${k.lostDeals} lost`} icon={<BadgePercent className="h-4 w-4" />} accent="sky" />
          <StatCard label="Average deal value" value={formatMoney(k.averageDealValue, currency)} sub="won revenue / won deals" icon={<CircleDollarSign className="h-4 w-4" />} />
          <StatCard label="Open pipeline" value={formatMoney(k.openPipelineValue, currency)} sub={`${k.openDeals} open deals`} icon={<Wallet className="h-4 w-4" />} accent="violet" />
          <StatCard label="Weighted forecast" value={formatMoney(k.weightedForecast, currency)} sub="Σ value × probability / 100" icon={<Gauge className="h-4 w-4" />} accent="amber" />
          <StatCard label="Lead conversion" value={`${k.conversionRate}%`} sub={`${formatNumber(k.newLeads)} new leads in range`} icon={<Target className="h-4 w-4" />} />
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Revenue by month" description="Last 6 months, won deals" />
          <div className="p-5">{data ? <RevenueChart data={data.revenueByMonth} currency={currency} /> : <Skeleton className="h-64" />}</div>
        </Card>
        <Card>
          <CardHeader title="Lead source distribution" />
          <div className="p-5">{data ? <SourceChart data={data.leadsBySource} /> : <Skeleton className="h-64" />}</div>
        </Card>
        <Card>
          <CardHeader title="Deals by stage" description={data?.pipeline?.name} />
          <div className="p-5">{data ? <StageChart data={data.dealsByStage} currency={currency} /> : <Skeleton className="h-64" />}</div>
        </Card>
        <Card>
          <CardHeader title="Stage breakdown" />
          <Table className="min-w-0">
            <thead>
              <tr>
                <Th>Stage</Th>
                <Th className="text-right">Deals</Th>
                <Th className="text-right">Value</Th>
              </tr>
            </thead>
            <tbody>
              {data?.dealsByStage.map((s) => (
                <tr key={s.stage}>
                  <Td>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                      {s.stage}
                    </span>
                  </Td>
                  <Td className="text-right">{s.count}</Td>
                  <Td className="text-right font-medium text-slate-900">{formatMoney(s.value, currency)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
          {data && data.topPerformers.length > 0 && (
            <>
              <div className="border-t border-line px-5 py-3 text-sm font-semibold text-slate-900">Top performers</div>
              <Table className="min-w-0">
                <tbody>
                  {data.topPerformers.map((p) => (
                    <tr key={p.userId}>
                      <Td>{p.name}</Td>
                      <Td className="text-right">{p.deals} won</Td>
                      <Td className="text-right font-medium text-slate-900">{formatMoney(p.revenue, currency)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
