import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-violet-500 shadow-lg shadow-brand-600/30", className)}>
      <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 17l5-5 4 4 7-8" />
        <path d="M15 8h5v5" />
      </svg>
    </span>
  );
}

export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className={cn("text-[15px] font-semibold tracking-tight", light ? "text-white" : "text-slate-900")}>
        LeadFlow<span className={light ? "text-brand-300" : "text-brand-600"}> CRM</span>
      </span>
    </span>
  );
}
