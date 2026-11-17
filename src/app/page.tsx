import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Building2,
  CalendarCheck,
  Check,
  FileSpreadsheet,
  GitBranch,
  Globe,
  KanbanSquare,
  Lock,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/logo";

const features = [
  { icon: Zap, title: "Lead capture that never drops", body: "Website forms, CSV imports and manual entry land in one inbox with duplicate detection and instant round-robin assignment." },
  { icon: CalendarCheck, title: "Follow-ups on autopilot", body: "Every new lead gets a call task. Overdue reminders and daily digests keep your reps accountable." },
  { icon: KanbanSquare, title: "Visual deal pipeline", body: "Drag deals across custom stages. Won deals need a final amount, lost deals need a reason — so your data stays honest." },
  { icon: BarChart3, title: "Live revenue reporting", body: "Conversion rate, win rate, weighted forecast and leaderboards computed from real records, never hard-coded." },
  { icon: ShieldCheck, title: "Role-based access", body: "Owner, admin, manager, sales rep and viewer roles enforced on the server. Reps only ever see their own book." },
  { icon: Lock, title: "True multi-tenancy", body: "Each workspace is fully isolated. Switch between businesses without data ever crossing the line." },
];

const steps = [
  { icon: Globe, title: "Capture", body: "Leads arrive from your site via API key, CSV or quick-add." },
  { icon: Users, title: "Assign", body: "Round-robin routing with an SLA task due in two hours." },
  { icon: GitBranch, title: "Convert", body: "One click turns a qualified lead into contact, company and deal." },
  { icon: BarChart3, title: "Close & report", body: "Track every stage move and forecast revenue with confidence." },
];

const plans = [
  { name: "Starter", price: "₹0", period: "forever", desc: "For founders validating their sales motion.", features: ["Up to 3 users", "1,000 leads", "1 pipeline", "CSV import & export"], cta: "Start free", highlight: false },
  { name: "Growth", price: "₹799", period: "per user / month", desc: "For teams that need routing and reporting.", features: ["Unlimited leads", "Multiple pipelines", "Website lead API", "Reports & leaderboards", "Audit log"], cta: "Start 14-day trial", highlight: true },
  { name: "Scale", price: "Custom", period: "annual billing", desc: "For multi-branch businesses and agencies.", features: ["Unlimited workspaces", "Advanced permissions", "Priority support", "Dedicated onboarding"], cta: "Talk to sales", highlight: false },
];

function ProductPreview() {
  const cols = [
    { name: "Discovery", color: "#6366f1", deals: [["Harbor Suites renewal", "₹4.2L"], ["Lotus Clinics rollout", "₹2.8L"]] },
    { name: "Proposal", color: "#0ea5e9", deals: [["Peak Fitness — 6 branches", "₹6.5L"], ["Saffron Dining POS", "₹1.9L"]] },
    { name: "Negotiation", color: "#f59e0b", deals: [["Crescent Realty CRM", "₹9.1L"]] },
    { name: "Won", color: "#10b981", deals: [["Meridian Hotels", "₹12.4L"]] },
  ];
  return (
    <div className="relative mx-auto mt-16 max-w-5xl">
      <div className="absolute -inset-x-10 -top-10 bottom-0 rounded-[40px] bg-gradient-to-b from-brand-500/25 via-violet-500/10 to-transparent blur-3xl" />
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-ink-900/80 shadow-2xl shadow-black/40 ring-1 ring-white/5 backdrop-blur">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          <span className="ml-3 text-xs text-slate-400">Northwind Growth Partners · Sales pipeline</span>
        </div>
        <div className="grid grid-cols-4 gap-4 border-b border-white/10 p-5">
          {[
            ["Pipeline value", "₹48.6L", "+12.4%"],
            ["Weighted forecast", "₹21.3L", "+8.1%"],
            ["Win rate", "34%", "+3.2 pts"],
            ["Overdue tasks", "3", "−9 this week"],
          ].map(([l, v, d]) => (
            <div key={l} className="rounded-xl bg-white/[0.04] p-3 ring-1 ring-white/5">
              <p className="text-[11px] text-slate-400">{l}</p>
              <p className="mt-1 text-lg font-semibold text-white">{v}</p>
              <p className="text-[11px] text-emerald-400">{d}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-3 p-5">
          {cols.map((c) => (
            <div key={c.name}>
              <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-300">
                <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                {c.name}
              </div>
              <div className="space-y-2">
                {c.deals.map(([t, v]) => (
                  <div key={t} className="rounded-lg bg-white/[0.06] p-2.5 ring-1 ring-white/5">
                    <p className="truncate text-xs font-medium text-white">{t}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="bg-white">
      <section className="relative overflow-hidden bg-ink-950 pb-24 text-white">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
        <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Logo light />
          <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#workflow" className="hover:text-white">Workflow</a>
            <a href="#pricing" className="hover:text-white">Pricing</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:text-white">Sign in</Link>
            <Link href="/register" className="rounded-lg bg-white px-3.5 py-2 text-sm font-semibold text-ink-900 shadow hover:bg-slate-100">Get started</Link>
          </div>
        </header>
        <div className="relative z-10 mx-auto max-w-4xl px-6 pt-16 text-center sm:pt-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-brand-200">
            <Sparkles className="h-3.5 w-3.5" /> Built for growing sales teams
          </span>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-6xl">
            Turn every lead into <span className="text-gradient">predictable revenue</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
            LeadFlow CRM captures leads, assigns ownership, schedules follow-ups and tracks your pipeline — all inside a secure, multi-tenant workspace your whole team can trust.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/login?demo=1" className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition hover:bg-brand-500">
              Explore the live demo <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/register" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
              Create your workspace
            </Link>
          </div>
          <p className="mt-4 text-xs text-slate-400">No credit card · Demo data is fictional · Sign in as any role</p>
        </div>
        <div className="relative z-10 px-6">
          <ProductPreview />
        </div>
      </section>

      <section className="border-b border-line bg-white py-10">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-6 text-center sm:grid-cols-4">
          {[
            ["5 roles", "Server-enforced RBAC"],
            ["< 2 hrs", "Lead response SLA"],
            ["1 click", "Lead → deal conversion"],
            ["100%", "Workspace data isolation"],
          ].map(([v, l]) => (
            <div key={l}>
              <p className="text-2xl font-semibold text-slate-900">{v}</p>
              <p className="mt-1 text-xs text-slate-500">{l}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="bg-surface py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold text-brand-600">Everything your team needs</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">From first touch to closed-won</h2>
            <p className="mt-4 text-slate-500">Replace scattered spreadsheets, WhatsApp threads and sticky notes with one system of record.</p>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="group rounded-2xl border border-line bg-white p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-pop">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100 transition group-hover:bg-brand-600 group-hover:text-white">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-brand-600">How it works</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">A revenue workflow your reps will actually follow</h2>
              <p className="mt-4 text-slate-500">Every lead has an owner, every owner has a next step, and every step is on the timeline.</p>
              <div className="mt-10 space-y-6">
                {steps.map((s, i) => (
                  <div key={s.title} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink-900 text-sm font-semibold text-white">{i + 1}</div>
                    <div>
                      <h3 className="flex items-center gap-2 font-semibold text-slate-900"><s.icon className="h-4 w-4 text-brand-600" />{s.title}</h3>
                      <p className="mt-1 text-sm text-slate-500">{s.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: FileSpreadsheet, title: "CSV import", body: "Column mapping, duplicate strategy and a downloadable error report." },
                { icon: Bell, title: "Smart notifications", body: "Assignments, stage changes and overdue tasks in real time." },
                { icon: Building2, title: "Accounts & contacts", body: "Company roll-ups with open pipeline value and full history." },
                { icon: ShieldCheck, title: "Audit trail", body: "Role changes, exports and deletions recorded automatically." },
              ].map((c) => (
                <div key={c.title} className="rounded-2xl border border-line bg-surface p-5">
                  <c.icon className="h-5 w-5 text-brand-600" />
                  <h3 className="mt-3 text-sm font-semibold text-slate-900">{c.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{c.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-surface py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold text-brand-600">Pricing</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Simple plans that scale with you</h2>
          </div>
          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {plans.map((p) => (
              <div key={p.name} className={`relative flex flex-col rounded-2xl p-7 ${p.highlight ? "bg-ink-900 text-white shadow-2xl shadow-brand-900/30 ring-1 ring-brand-500/40" : "border border-line bg-white shadow-card"}`}>
                {p.highlight && <span className="absolute -top-3 left-7 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">Most popular</span>}
                <h3 className="font-semibold">{p.name}</h3>
                <p className={`mt-1 text-sm ${p.highlight ? "text-slate-300" : "text-slate-500"}`}>{p.desc}</p>
                <p className="mt-6 flex items-baseline gap-2">
                  <span className="text-4xl font-semibold tracking-tight">{p.price}</span>
                  <span className={`text-sm ${p.highlight ? "text-slate-400" : "text-slate-500"}`}>{p.period}</span>
                </p>
                <ul className="mt-6 flex-1 space-y-3 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Check className={`h-4 w-4 ${p.highlight ? "text-brand-300" : "text-brand-600"}`} /> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`mt-8 rounded-xl px-4 py-2.5 text-center text-sm font-semibold transition ${p.highlight ? "bg-brand-600 text-white hover:bg-brand-500" : "border border-line bg-white text-slate-900 hover:bg-slate-50"}`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="relative overflow-hidden rounded-3xl bg-ink-900 px-8 py-14 text-center text-white">
            <div className="bg-grid absolute inset-0 opacity-60" />
            <div className="absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-brand-600/30 blur-3xl" />
            <div className="relative">
              <h2 className="text-3xl font-semibold tracking-tight">See LeadFlow with real-looking data</h2>
              <p className="mx-auto mt-3 max-w-xl text-slate-300">Jump into a fully seeded demo workspace as an owner, manager, sales rep or viewer — and see how permissions change the experience.</p>
              <Link href="/login?demo=1" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-ink-900 hover:bg-slate-100">
                Launch demo <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <Logo />
          <p className="text-xs text-slate-500">© {new Date().getFullYear()} LeadFlow CRM. Demo product — all sample data is fictional.</p>
        </div>
      </footer>
    </div>
  );
}
