"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Archive, ArchiveRestore, Download, Plus, Search, Target, Upload, X } from "lucide-react";
import { LeadStatusBadge, SourceLabel } from "@/components/app/badges";
import { LeadFormDialog } from "@/components/app/forms";
import { ImportDialog } from "@/components/app/import-dialog";
import { MemberSelect } from "@/components/app/pickers";
import { Button } from "@/components/ui/button";
import { Checkbox, Input, Select } from "@/components/ui/form";
import { Avatar, Card, EmptyState, PageHeader, Pagination, Skeleton, Table, Tabs, Td, Th } from "@/components/ui/primitives";
import { api, errorMessage } from "@/lib/api";
import { LEAD_SOURCES, LEAD_STATUSES } from "@/lib/constants";
import { useCan, useCurrency, useDebounced, useInitialParam, useResettingPage } from "@/lib/hooks";
import type { Lead } from "@/lib/types";
import { cn, formatDate, formatMoney, fullName } from "@/lib/utils";

export default function LeadsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const can = useCan();
  const currency = useCurrency();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [archived, setArchived] = useState(false);
  const [sort, setSort] = useState("-createdAt");
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [bulkOwner, setBulkOwner] = useState("");
  const dq = useDebounced(q);
  useInitialParam("status", setStatus);

  const params = { q: dq, status, source, ownerId, archived: archived ? "true" : undefined, sort };
  const filterKey = JSON.stringify(params);
  const [page, setPage] = useResettingPage(filterKey);
  const [selection, setSelection] = useState({ key: filterKey, ids: new Set<string>() });
  const selected = selection.key === filterKey ? selection.ids : new Set<string>();
  const setSelected = (ids: Set<string>) => setSelection({ key: filterKey, ids });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["leads", params, page],
    queryFn: () => api.list<Lead>("/leads", { ...params, page, limit: 25 }),
    placeholderData: keepPreviousData,
  });

  const bulk = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post<{ updated: number }>("/leads/bulk", { ...body, ids: [...selected] }),
    onSuccess: (r) => {
      toast.success(`${r.updated} lead${r.updated === 1 ? "" : "s"} updated`);
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const exportCsv = async () => {
    try {
      await api.download("/leads/export", params, `leads-${new Date().toISOString().slice(0, 10)}.csv`);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const items = data?.data ?? [];
  const allSelected = items.length > 0 && items.every((l) => selected.has(l._id));
  const filtersActive = Boolean(dq || status || source || ownerId || archived);
  const canBulk = can("records:update") || can("records:archive");

  return (
    <div>
      <PageHeader
        title="Leads"
        description="Capture, qualify and convert enquiries from every channel."
        actions={
          <>
            <Button variant="secondary" onClick={exportCsv}>
              <Download className="h-4 w-4" /> Export
            </Button>
            {can("records:create") && (
              <>
                <Button variant="secondary" onClick={() => setImportOpen(true)}>
                  <Upload className="h-4 w-4" /> Import
                </Button>
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4" /> New lead
                </Button>
              </>
            )}
          </>
        }
      />

      <Card>
        <Tabs
          className="px-3"
          value={status}
          onChange={setStatus}
          items={[{ value: "", label: "All" }, ...LEAD_STATUSES.map((s) => ({ value: s.value, label: s.label }))]}
        />
        <div className="flex flex-wrap items-center gap-2 border-b border-line p-3">
          <div className="relative min-w-56 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, phone or company" className="pl-9" />
          </div>
          <Select value={source} onChange={(e) => setSource(e.target.value)} className="w-36">
            <option value="">All sources</option>
            {LEAD_SOURCES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </Select>
          {can("records:read_all") && <MemberSelect includeAll value={ownerId} onChange={setOwnerId} className="w-40" />}
          <Select value={sort} onChange={(e) => setSort(e.target.value)} className="w-44">
            <option value="-createdAt">Newest first</option>
            <option value="createdAt">Oldest first</option>
            <option value="-estimatedValue">Highest value</option>
            <option value="firstName">Name A–Z</option>
            <option value="nextFollowUpAt">Next follow-up</option>
          </Select>
          <Button variant={archived ? "outline" : "ghost"} size="md" onClick={() => setArchived((a) => !a)}>
            <Archive className="h-4 w-4" /> {archived ? "Viewing archived" : "Archived"}
          </Button>
          {filtersActive && (
            <Button
              variant="ghost"
              onClick={() => {
                setQ("");
                setStatus("");
                setSource("");
                setOwnerId("");
                setArchived(false);
              }}
            >
              <X className="h-4 w-4" /> Reset
            </Button>
          )}
        </div>

        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-line bg-brand-50/60 px-4 py-2.5">
            <span className="text-sm font-medium text-brand-800">{selected.size} selected</span>
            <span className="mx-1 h-4 w-px bg-brand-200" />
            {can("records:assign") && (
              <div className="flex items-center gap-1.5">
                <MemberSelect includeAll allLabel="Assign to…" value={bulkOwner} onChange={setBulkOwner} className="h-8 w-40 text-xs" />
                <Button size="sm" variant="secondary" disabled={!bulkOwner} loading={bulk.isPending} onClick={() => bulk.mutate({ action: "assign", ownerId: bulkOwner })}>
                  Assign
                </Button>
              </div>
            )}
            {can("records:update") && !archived && (
              <Select className="h-8 w-40 text-xs" value="" onChange={(e) => e.target.value && bulk.mutate({ action: "status", status: e.target.value })}>
                <option value="">Set status…</option>
                {LEAD_STATUSES.filter((s) => s.value !== "converted").map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </Select>
            )}
            {can("records:archive") &&
              (archived ? (
                <Button size="sm" variant="secondary" onClick={() => bulk.mutate({ action: "restore" })}>
                  <ArchiveRestore className="h-3.5 w-3.5" /> Restore
                </Button>
              ) : (
                <Button size="sm" variant="secondary" onClick={() => bulk.mutate({ action: "archive" })}>
                  <Archive className="h-3.5 w-3.5" /> Archive
                </Button>
              ))}
            <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setSelected(new Set())}>
              Clear
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : items.length === 0 ? (
          filtersActive ? (
            <EmptyState icon={<Search className="h-5 w-5" />} title="No leads match these filters" description="Try a different search or reset filters to see all leads." />
          ) : (
            <EmptyState
              icon={<Target className="h-5 w-5" />}
              title="No leads yet"
              description="Create your first lead, import a CSV or connect a website form through the lead capture API."
              action={
                can("records:create") && (
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setImportOpen(true)}>Import CSV</Button>
                    <Button onClick={() => setCreateOpen(true)}>Create lead</Button>
                  </div>
                )
              }
            />
          )
        ) : (
          <div className={cn("transition-opacity", isFetching && "opacity-60")}>
            <Table>
              <thead>
                <tr>
                  {canBulk && (
                    <Th className="w-10">
                      <Checkbox
                        checked={allSelected}
                        onChange={() => setSelected(allSelected ? new Set() : new Set(items.map((l) => l._id)))}
                        aria-label="Select all"
                      />
                    </Th>
                  )}
                  <Th>Lead</Th>
                  <Th>Company</Th>
                  <Th>Status</Th>
                  <Th>Source</Th>
                  <Th className="text-right">Value</Th>
                  <Th>Owner</Th>
                  <Th>Follow-up</Th>
                  <Th>Created</Th>
                </tr>
              </thead>
              <tbody>
                {items.map((l) => {
                  const overdue = l.nextFollowUpAt && new Date(l.nextFollowUpAt) < new Date() && l.status !== "converted";
                  return (
                    <tr key={l._id} className={cn("cursor-pointer transition hover:bg-slate-50/80", selected.has(l._id) && "bg-brand-50/40")} onClick={() => router.push(`/leads/${l._id}`)}>
                      {canBulk && (
                        <Td onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selected.has(l._id)}
                            onChange={() => {
                              const next = new Set(selected);
                              if (next.has(l._id)) next.delete(l._id);
                              else next.add(l._id);
                              setSelected(next);
                            }}
                            aria-label={`Select ${fullName(l)}`}
                          />
                        </Td>
                      )}
                      <Td>
                        <Link href={`/leads/${l._id}`} className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                          <Avatar name={fullName(l)} size="sm" />
                          <span className="min-w-0">
                            <span className="block font-medium text-slate-900">{fullName(l)}</span>
                            <span className="block text-xs text-slate-500">{l.email ?? l.phone ?? "—"}</span>
                          </span>
                        </Link>
                      </Td>
                      <Td>
                        <span className="block text-slate-800">{l.companyName || "—"}</span>
                        {l.jobTitle && <span className="block text-xs text-slate-500">{l.jobTitle}</span>}
                      </Td>
                      <Td><LeadStatusBadge status={l.status} /></Td>
                      <Td><SourceLabel source={l.source} /></Td>
                      <Td className="text-right font-medium text-slate-900">{formatMoney(l.estimatedValue, l.currency || currency)}</Td>
                      <Td>
                        <span className="flex items-center gap-2">
                          <Avatar name={l.ownerId?.name ?? "?"} size="xs" />
                          <span className="text-slate-600">{l.ownerId?.name}</span>
                        </span>
                      </Td>
                      <Td className={cn(overdue ? "font-medium text-rose-600" : "text-slate-600")}>{l.nextFollowUpAt ? formatDate(l.nextFollowUpAt, "d MMM") : "—"}</Td>
                      <Td className="text-slate-500">{formatDate(l.createdAt, "d MMM yyyy")}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
            {data && <Pagination page={data.meta.page} pages={data.meta.pages} total={data.meta.total} onChange={setPage} label="leads" />}
          </div>
        )}
      </Card>

      <LeadFormDialog open={createOpen} onOpenChange={setCreateOpen} onSaved={(l) => router.push(`/leads/${l._id}`)} />
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}
