"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  Check,
  CheckSquare,
  ChevronsUpDown,
  KanbanSquare,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Plus,
  ScrollText,
  Settings,
  Target,
  Users,
  UsersRound,
  Workflow,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Dropdown, DropdownContent, DropdownItem, DropdownLabel, DropdownSeparator, DropdownTrigger } from "@/components/ui/dialog";
import { Avatar } from "@/components/ui/primitives";
import { useLogout, useSession, useSwitchWorkspace } from "@/lib/hooks";
import type { Permission } from "@/lib/types";
import { cn, labelize } from "@/lib/utils";

const MAIN = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Target },
  { href: "/contacts", label: "Contacts", icon: UsersRound },
  { href: "/companies", label: "Companies", icon: Building2 },
  { href: "/deals", label: "Deals", icon: KanbanSquare },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

const ADMIN: Array<{ href: string; label: string; icon: typeof Settings; perm?: Permission }> = [
  { href: "/settings", label: "Workspace", icon: Settings },
  { href: "/settings/team", label: "Team", icon: Users },
  { href: "/settings/pipelines", label: "Pipelines", icon: Workflow },
  { href: "/settings/api-keys", label: "API & lead capture", icon: KeyRound, perm: "apikeys:manage" },
  { href: "/settings/audit-log", label: "Audit log", icon: ScrollText, perm: "audit:view" },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const logout = useLogout();
  const switchWs = useSwitchWorkspace();
  const active = session?.activeWorkspace;

  const isActive = (href: string) => (href === "/settings" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));
  const link = (item: { href: string; label: string; icon: typeof Settings }) => (
    <Link
      key={item.href}
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
        isActive(item.href) ? "bg-white/10 text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]" : "text-slate-400 hover:bg-white/5 hover:text-slate-100",
      )}
    >
      <item.icon className={cn("h-4 w-4", isActive(item.href) ? "text-brand-300" : "text-slate-500 group-hover:text-slate-300")} />
      {item.label}
    </Link>
  );

  return (
    <div className="flex h-full flex-col bg-ink-900 text-slate-300">
      <div className="px-5 pb-4 pt-5">
        <Link href="/dashboard" onClick={onNavigate}>
          <Logo light />
        </Link>
      </div>

      <div className="px-3">
        <Dropdown>
          <DropdownTrigger className="flex w-full items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-left transition hover:bg-white/[0.07]">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-brand-400 to-violet-500 text-xs font-bold text-white">
              {active?.name?.[0] ?? "W"}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold text-white">{active?.name ?? "Workspace"}</span>
              <span className="block text-[11px] text-slate-400">{active ? labelize(active.role) : ""}</span>
            </span>
            <ChevronsUpDown className="h-4 w-4 text-slate-500" />
          </DropdownTrigger>
          <DropdownContent align="start" className="w-60">
            <DropdownLabel>Workspaces</DropdownLabel>
            {session?.workspaces.map((w) => (
              <DropdownItem key={w.id} onSelect={() => w.id !== active?.id && switchWs.mutate(w.id)}>
                <span className="flex h-6 w-6 items-center justify-center rounded bg-brand-50 text-[11px] font-bold text-brand-700">{w.name[0]}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{w.name}</span>
                  <span className="block text-[11px] text-slate-400">{labelize(w.role)}</span>
                </span>
                {w.id === active?.id && <Check className="h-4 w-4 text-brand-600" />}
              </DropdownItem>
            ))}
            <DropdownSeparator />
            <DropdownItem onSelect={() => (window.location.href = "/onboarding")}>
              <Plus className="h-4 w-4" /> Create workspace
            </DropdownItem>
          </DropdownContent>
        </Dropdown>
      </div>

      <nav className="mt-5 flex-1 space-y-6 overflow-y-auto px-3 scrollbar-thin">
        <div className="space-y-0.5">{MAIN.map(link)}</div>
        <div>
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Settings</p>
          <div className="space-y-0.5">{ADMIN.filter((i) => !i.perm || session?.permissions.includes(i.perm)).map(link)}</div>
        </div>
      </nav>

      {session && (
        <div className="border-t border-white/[0.06] p-3">
          <Dropdown>
            <DropdownTrigger className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-white/5">
              <Avatar name={session.user.name} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-white">{session.user.name}</span>
                <span className="block truncate text-[11px] text-slate-500">{session.user.email}</span>
              </span>
            </DropdownTrigger>
            <DropdownContent align="start" className="w-56">
              <DropdownItem danger onSelect={() => logout.mutate()}>
                <LogOut className="h-4 w-4" /> Sign out
              </DropdownItem>
            </DropdownContent>
          </Dropdown>
        </div>
      )}
    </div>
  );
}
