"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Building2, CheckSquare, KanbanSquare, Plus, Target, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dropdown, DropdownContent, DropdownItem, DropdownTrigger } from "@/components/ui/dialog";
import { useCan } from "@/lib/hooks";
import { CompanyFormDialog, ContactFormDialog, DealFormDialog, LeadFormDialog, TaskFormDialog } from "./forms";

type Kind = "lead" | "contact" | "company" | "deal" | "task" | null;

export function QuickAdd() {
  const can = useCan();
  const router = useRouter();
  const [kind, setKind] = useState<Kind>(null);
  if (!can("records:create")) return null;
  const close = (o: boolean) => !o && setKind(null);
  return (
    <>
      <Dropdown>
        <DropdownTrigger asChild>
          <Button size="md" className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New</span>
          </Button>
        </DropdownTrigger>
        <DropdownContent>
          <DropdownItem onSelect={() => setKind("lead")}><Target className="h-4 w-4 text-slate-400" /> Lead</DropdownItem>
          <DropdownItem onSelect={() => setKind("deal")}><KanbanSquare className="h-4 w-4 text-slate-400" /> Deal</DropdownItem>
          <DropdownItem onSelect={() => setKind("contact")}><UsersRound className="h-4 w-4 text-slate-400" /> Contact</DropdownItem>
          <DropdownItem onSelect={() => setKind("company")}><Building2 className="h-4 w-4 text-slate-400" /> Company</DropdownItem>
          <DropdownItem onSelect={() => setKind("task")}><CheckSquare className="h-4 w-4 text-slate-400" /> Task</DropdownItem>
        </DropdownContent>
      </Dropdown>
      <LeadFormDialog open={kind === "lead"} onOpenChange={close} onSaved={(l) => router.push(`/leads/${l._id}`)} />
      <DealFormDialog open={kind === "deal"} onOpenChange={close} onSaved={(d) => router.push(`/deals/${d._id}`)} />
      <ContactFormDialog open={kind === "contact"} onOpenChange={close} onSaved={(c) => router.push(`/contacts/${c._id}`)} />
      <CompanyFormDialog open={kind === "company"} onOpenChange={close} onSaved={(c) => router.push(`/companies/${c._id}`)} />
      <TaskFormDialog open={kind === "task"} onOpenChange={close} />
    </>
  );
}
