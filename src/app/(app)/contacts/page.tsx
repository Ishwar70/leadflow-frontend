"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Search, UsersRound } from "lucide-react";
import { ContactFormDialog } from "@/components/app/forms";
import { MemberSelect } from "@/components/app/pickers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { Avatar, Card, EmptyState, PageHeader, Pagination, Skeleton, Table, Td, Th } from "@/components/ui/primitives";
import { api } from "@/lib/api";
import { useCan, useDebounced, useResettingPage } from "@/lib/hooks";
import type { Contact } from "@/lib/types";
import { cn, formatDate, fullName } from "@/lib/utils";

export default function ContactsPage() {
  const router = useRouter();
  const can = useCan();
  const [q, setQ] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [open, setOpen] = useState(false);
  const dq = useDebounced(q);
  const [page, setPage] = useResettingPage(`${dq}|${ownerId}`);
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["contacts", dq, ownerId, page],
    queryFn: () => api.list<Contact>("/contacts", { q: dq, ownerId, page, limit: 25 }),
    placeholderData: keepPreviousData,
  });
  const items = data?.data ?? [];

  return (
    <div>
      <PageHeader
        title="Contacts"
        description="People you do business with, linked to their companies and deals."
        actions={can("records:create") && <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New contact</Button>}
      />
      <Card>
        <div className="flex flex-wrap gap-2 border-b border-line p-3">
          <div className="relative min-w-56 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search contacts" className="pl-9" />
          </div>
          {can("records:read_all") && <MemberSelect includeAll value={ownerId} onChange={setOwnerId} className="w-44" />}
        </div>
        {isLoading ? (
          <div className="space-y-2 p-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<UsersRound className="h-5 w-5" />}
            title={dq ? "No contacts match your search" : "No contacts yet"}
            description={dq ? "Try another name, email or company." : "Contacts are created when you convert a qualified lead, or you can add them directly."}
            action={!dq && can("records:create") && <Button onClick={() => setOpen(true)}>Add contact</Button>}
          />
        ) : (
          <div className={cn(isFetching && "opacity-60")}>
            <Table>
              <thead>
                <tr><Th>Name</Th><Th>Company</Th><Th>Email</Th><Th>Phone</Th><Th>Owner</Th><Th>Added</Th></tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c._id} className="cursor-pointer hover:bg-slate-50/80" onClick={() => router.push(`/contacts/${c._id}`)}>
                    <Td>
                      <span className="flex items-center gap-3">
                        <Avatar name={fullName(c)} size="sm" />
                        <span>
                          <span className="block font-medium text-slate-900">{fullName(c)}</span>
                          <span className="block text-xs text-slate-500">{c.jobTitle}</span>
                        </span>
                      </span>
                    </Td>
                    <Td>
                      {c.companyId ? (
                        <Link href={`/companies/${c.companyId._id}`} onClick={(e) => e.stopPropagation()} className="text-brand-600 hover:underline">{c.companyId.name}</Link>
                      ) : "—"}
                    </Td>
                    <Td className="text-slate-600">{c.email ?? "—"}</Td>
                    <Td className="text-slate-600">{c.phone ?? "—"}</Td>
                    <Td className="text-slate-600">{c.ownerId?.name}</Td>
                    <Td className="text-slate-500">{formatDate(c.createdAt)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            {data && <Pagination page={data.meta.page} pages={data.meta.pages} total={data.meta.total} onChange={setPage} label="contacts" />}
          </div>
        )}
      </Card>
      <ContactFormDialog open={open} onOpenChange={setOpen} onSaved={(c) => router.push(`/contacts/${c._id}`)} />
    </div>
  );
}
