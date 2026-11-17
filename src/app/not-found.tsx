import Link from "next/link";
import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 text-center">
      <Logo />
      <p className="mt-10 text-sm font-semibold text-brand-600">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Page not found</h1>
      <p className="mt-3 max-w-sm text-sm text-slate-500">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
      <div className="mt-8 flex gap-3">
        <Link href="/dashboard" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">Go to dashboard</Link>
        <Link href="/" className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Home</Link>
      </div>
    </div>
  );
}
