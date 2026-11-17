import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/logo";

const points = [
  "Strict workspace isolation and role-based access",
  "Lead-to-deal workflow with drag-and-drop pipeline",
  "Follow-ups, timelines and audit trail built in",
  "Dashboards calculated from your real data",
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-ink-900 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="bg-grid absolute inset-0" />
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-600/30 blur-3xl" />
        <div className="absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />
        <Link href="/" className="relative">
          <Logo light />
        </Link>
        <div className="relative max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight text-white">
            Every enquiry, <span className="text-gradient">traceable</span> from first touch to closed revenue.
          </h2>
          <ul className="mt-8 space-y-3.5">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-3 text-sm text-slate-300">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" />
                {p}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-slate-500">Demo data is fictional. © {new Date().getFullYear()} LeadFlow CRM</p>
      </aside>
      <main className="flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-10 inline-block lg:hidden">
            <Logo />
          </Link>
          {children}
        </div>
      </main>
    </div>
  );
}
