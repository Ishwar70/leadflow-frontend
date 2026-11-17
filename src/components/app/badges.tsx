import { Badge, type Tone } from "@/components/ui/primitives";
import { LEAD_SOURCES, LEAD_STATUSES } from "@/lib/constants";
import { labelize } from "@/lib/utils";

export function LeadStatusBadge({ status }: { status: string }) {
  const s = LEAD_STATUSES.find((x) => x.value === status);
  return (
    <Badge tone={(s?.tone ?? "slate") as Tone} dot>
      {s?.label ?? labelize(status)}
    </Badge>
  );
}

export function SourceLabel({ source }: { source: string }) {
  return <span className="text-slate-600">{LEAD_SOURCES.find((s) => s.value === source)?.label ?? labelize(source)}</span>;
}

export function DealStatusBadge({ status }: { status: string }) {
  const tone: Tone = status === "won" ? "emerald" : status === "lost" ? "rose" : "brand";
  return (
    <Badge tone={tone} dot>
      {status === "open" ? "Open" : status === "won" ? "Won" : "Lost"}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const tone: Tone = priority === "high" ? "rose" : priority === "medium" ? "amber" : "slate";
  return <Badge tone={tone}>{labelize(priority)}</Badge>;
}
