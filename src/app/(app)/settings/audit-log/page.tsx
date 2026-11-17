"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight, ScrollText } from "lucide-react";
import { Select } from "@/components/ui/form";
import { Avatar, Badge, Card, EmptyState, PageHeader, Pagination, Skeleton, Table, Td, Th, type Tone } from "@/components/ui/primitives";
import { api } from "@/lib/api";
import { useCan, useResettingPage } from "@/lib/hooks";
import { formatDateTime, labelize } from "@/lib/utils";

interface AuditEntry {
  _id: string;
  actorName: string;
  action: string;
  entityType: string;
  entityName: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  createdAt: string;
}

const ENTITY_TYPES = ["lead", "contact", "company", "deal", "task", "pipeline", "member", "invitation", "workspace", "api_key"];

function actionTone(action: string): Tone {
  if (/deleted|archived|revoked|deactivated|lost/.test(action)) return "rose";
  if (/created|accepted|won|converted|reactivated/.test(action)) return "emerald";
  if (/role|assigned|default/.test(action)) return "violet";
  return "sky";
}

function Json({ value }: { value: unknown }) {
  return <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-slate-50 p-3 text-[11px] text-slate-600 ring-1 ring-line scrollbar-thin">{JSON.stringify(value, null, 2)}</pre>;
}

export default function AuditLogPage() {
  const can = useCan();
  const allowed = can("audit:view");
  const [entityType, setEntityType] = useState("");
  const [page, setPage] = useResettingPage(entityType);
  const [expanded, setExpanded] = useState<string | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["audit", entityType, page],
    queryFn: () => api.list<AuditEntry>("/audit-logs", { entityType, page, limit: 30 }),
    placeholderData: keepPreviousData,
    enabled: allowed,
  });

  if (!allowed)
    return (
      <Card className="max-w-3xl">
        <EmptyState icon={<ScrollText className="h-5 w-5" />} title="Restricted" description="Only workspace owners and admins can view the audit log." />
      </Card>
    );

  return (
    <div className="max-w-6xl">
      <PageHeader
        title="Audit log"
        description="A record of sensitive changes across this workspace: who changed what, and when."
        actions={
          <Select value={entityType} onChange={(e) => setEntityType(e.target.value)} className="w-44">
            <option value="">All entities</option>
            {ENTITY_TYPES.map((t) => <option key={t} value={t}>{labelize(t)}</option>)}
          </Select>
        }
      />
      <Card>
        {isLoading ? (
          <div className="space-y-3 p-5">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : !data?.data.length ? (
          <EmptyState icon={<ScrollText className="h-5 w-5" />} title="No audit entries" description="Changes to records, members and settings will be recorded here." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th className="w-8" />
                <Th>When</Th>
                <Th>Actor</Th>
                <Th>Action</Th>
                <Th>Record</Th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((e) => {
                const hasDetail = !!(e.before || e.after);
                const open = expanded === e._id;
                return (
                  <Fragment key={e._id}>
                    <tr className={hasDetail ? "cursor-pointer hover:bg-slate-50/70" : ""} onClick={() => hasDetail && setExpanded(open ? null : e._id)}>
                      <Td className="pr-0 text-slate-400">{hasDetail && (open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}</Td>
                      <Td className="text-slate-500">{formatDateTime(e.createdAt)}</Td>
                      <Td>
                        <span className="flex items-center gap-2">
                          <Avatar name={e.actorName} size="xs" />
                          {e.actorName}
                        </span>
                      </Td>
                      <Td><Badge tone={actionTone(e.action)}>{e.action}</Badge></Td>
                      <Td>
                        <span className="text-slate-500">{labelize(e.entityType)}</span>
                        {e.entityName && <span className="ml-1.5 font-medium text-slate-800">{e.entityName}</span>}
                      </Td>
                    </tr>
                    {open && (
                      <tr>
                        <td colSpan={5} className="border-t border-line/70 bg-slate-50/40 px-4 py-3">
                          <div className="grid gap-3 md:grid-cols-2">
                            <div>
                              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Before</p>
                              {e.before ? <Json value={e.before} /> : <p className="text-xs text-slate-400">—</p>}
                            </div>
                            <div>
                              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">After</p>
                              {e.after ? <Json value={e.after} /> : <p className="text-xs text-slate-400">—</p>}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </Table>
        )}
        {data && <Pagination page={data.meta.page} pages={data.meta.pages} total={data.meta.total} onChange={setPage} label="entries" />}
      </Card>
    </div>
  );
}
