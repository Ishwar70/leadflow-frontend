import { clsx, type ClassValue } from "clsx";
import { format, formatDistanceToNowStrict, isToday, isTomorrow, isYesterday } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(value: number | null | undefined, currency = "INR", compact = false) {
  const v = value ?? 0;
  try {
    return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: compact && v >= 1000 ? 1 : 0,
      notation: compact ? "compact" : "standard",
    }).format(v);
  } catch {
    return `${currency} ${v.toLocaleString()}`;
  }
}

export function formatNumber(v: number) {
  return new Intl.NumberFormat("en-IN").format(v);
}

export function fullName(p: { firstName?: string; lastName?: string | null } | null | undefined) {
  if (!p) return "";
  return `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim();
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function formatDate(d: string | Date | null | undefined, pattern = "d MMM yyyy") {
  if (!d) return "—";
  return format(new Date(d), pattern);
}

export function formatDateTime(d: string | Date | null | undefined) {
  if (!d) return "—";
  const date = new Date(d);
  const time = format(date, "h:mm a");
  if (isToday(date)) return `Today, ${time}`;
  if (isTomorrow(date)) return `Tomorrow, ${time}`;
  if (isYesterday(date)) return `Yesterday, ${time}`;
  return format(date, "d MMM, h:mm a");
}

export function timeAgo(d: string | Date | null | undefined) {
  if (!d) return "—";
  return `${formatDistanceToNowStrict(new Date(d))} ago`;
}

export function toInputDate(d: string | Date | null | undefined) {
  if (!d) return "";
  return format(new Date(d), "yyyy-MM-dd");
}

export function toInputDateTime(d: string | Date | null | undefined) {
  if (!d) return "";
  return format(new Date(d), "yyyy-MM-dd'T'HH:mm");
}

export function labelize(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function avatarColor(seed: string) {
  const palette = [
    "bg-brand-100 text-brand-700",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-sky-100 text-sky-700",
    "bg-rose-100 text-rose-700",
    "bg-violet-100 text-violet-700",
    "bg-teal-100 text-teal-700",
  ];
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return palette[h % palette.length];
}
