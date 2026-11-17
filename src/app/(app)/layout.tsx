"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Search, X } from "lucide-react";
import { CommandSearch } from "@/components/app/command-search";
import { Notifications } from "@/components/app/notifications";
import { QuickAdd } from "@/components/app/quick-add";
import { Sidebar } from "@/components/app/sidebar";
import { LogoMark } from "@/components/logo";
import { Badge, Skeleton } from "@/components/ui/primitives";
import { useSession } from "@/lib/hooks";
import { labelize } from "@/lib/utils";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, isLoading } = useSession();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    if (session && !session.activeWorkspace) router.replace("/onboarding");
  }, [session, router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (isLoading || !session?.activeWorkspace) {
    return (
      <div className="flex h-screen">
        <div className="hidden w-64 bg-ink-900 lg:block" />
        <div className="flex-1 space-y-4 p-8">
          <Skeleton className="h-8 w-56" />
          <div className="grid grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const role = session.activeWorkspace.role;

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="hidden w-64 shrink-0 lg:block">
        <Sidebar />
      </aside>

      {mobileNav && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/60" onClick={() => setMobileNav(false)} />
          <div className="relative h-full w-72 animate-slide-up">
            <Sidebar onNavigate={() => setMobileNav(false)} />
            <button onClick={() => setMobileNav(false)} className="absolute right-3 top-5 rounded-md p-1 text-slate-400 hover:text-white" aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-line bg-white/80 px-4 backdrop-blur sm:px-6">
          <button onClick={() => setMobileNav(true)} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <LogoMark className="h-7 w-7 lg:hidden" />
          <button
            onClick={() => setSearchOpen(true)}
            className="flex h-9 w-full max-w-md items-center gap-2.5 rounded-lg border border-line bg-slate-50/80 px-3 text-sm text-slate-400 transition hover:border-slate-300 hover:bg-white"
          >
            <Search className="h-4 w-4" />
            <span className="flex-1 text-left">Search…</span>
            <kbd className="hidden rounded border border-line bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-500 sm:inline">Ctrl K</kbd>
          </button>
          <div className="ml-auto flex items-center gap-2">
            {session.activeWorkspace.isDemo && <Badge tone="amber" className="hidden md:inline-flex">Demo data</Badge>}
            {(role === "viewer" || role === "sales_rep") && <Badge tone={role === "viewer" ? "slate" : "sky"} className="hidden sm:inline-flex">{labelize(role)}</Badge>}
            <Notifications />
            <QuickAdd />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
        </main>
      </div>
      <CommandSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
