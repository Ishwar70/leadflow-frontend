import type { HTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { avatarColor, cn, initials } from "@/lib/utils";
import { Button } from "./button";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-xl border border-line bg-white shadow-card", className)} {...props} />;
}

export function CardHeader({ title, description, action, className }: { title: ReactNode; description?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-4 border-b border-line px-5 py-4", className)}>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

const tones = {
  brand: "bg-brand-50 text-brand-700 ring-brand-600/15",
  sky: "bg-sky-50 text-sky-700 ring-sky-600/15",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/20",
  rose: "bg-rose-50 text-rose-700 ring-rose-600/15",
  violet: "bg-violet-50 text-violet-700 ring-violet-600/15",
  slate: "bg-slate-100 text-slate-600 ring-slate-500/15",
} as const;
export type Tone = keyof typeof tones;

export function Badge({ tone = "slate", children, className, dot }: { tone?: Tone; children: ReactNode; className?: string; dot?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset", tones[tone], className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function Avatar({ name, size = "md", className }: { name: string; size?: "xs" | "sm" | "md" | "lg"; className?: string }) {
  const sizes = { xs: "h-5 w-5 text-[9px]", sm: "h-7 w-7 text-[11px]", md: "h-8 w-8 text-xs", lg: "h-11 w-11 text-sm" };
  return (
    <span
      title={name}
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-semibold", sizes[size], avatarColor(name || "?"), className)}
    >
      {initials(name || "?")}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-slate-200/70", className)} />;
}

export function PageHeader({ title, description, actions, back }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-6">
      {back && (
        <Link href={back.href} className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800">
          <ChevronLeft className="h-3.5 w-3.5" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">{title}</h1>
          {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, description, action, className }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-14 text-center", className)}>
      {icon && <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">{icon}</div>}
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Pagination({ page, pages, total, onChange, label = "results" }: { page: number; pages: number; total: number; onChange: (p: number) => void; label?: string }) {
  if (total === 0) return null;
  return (
    <div className="flex items-center justify-between border-t border-line px-4 py-3 text-xs text-slate-500">
      <span>
        Page <span className="font-medium text-slate-700">{page}</span> of {Math.max(pages, 1)} · {total.toLocaleString()} {label}
      </span>
      <div className="flex gap-1.5">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Next page">
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className={cn("w-full min-w-[720px] text-left text-sm", className)}>{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return <th className={cn("whitespace-nowrap bg-slate-50/80 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500", className)}>{children}</th>;
}

export function Td({ children, className, ...props }: HTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn("whitespace-nowrap border-t border-line/70 px-4 py-3 text-slate-700", className)} {...props}>
      {children}
    </td>
  );
}

export function Tabs<T extends string>({ value, onChange, items, className }: { value: T; onChange: (v: T) => void; items: Array<{ value: T; label: string; count?: number }>; className?: string }) {
  return (
    <div className={cn("flex gap-1 overflow-x-auto border-b border-line scrollbar-thin", className)} role="tablist">
      {items.map((it) => (
        <button
          key={it.value}
          role="tab"
          aria-selected={value === it.value}
          onClick={() => onChange(it.value)}
          className={cn(
            "-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
            value === it.value ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500 hover:text-slate-800",
          )}
        >
          {it.label}
          {it.count !== undefined && (
            <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-semibold", value === it.value ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-500")}>{it.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

export function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 py-2 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="min-w-0 break-words text-slate-800">{children || <span className="text-slate-400">—</span>}</dd>
    </div>
  );
}
