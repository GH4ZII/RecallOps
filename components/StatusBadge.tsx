import type { ActionStatus, Severity } from "@/lib/demo/types";

type BadgeKind = Severity | ActionStatus | "ACTIVE" | "RESOLVED" | "PENDING";

const styles: Record<string, string> = {
  CRITICAL: "bg-red-50 text-danger border-red-200",
  HIGH: "bg-orange-50 text-warn border-orange-200",
  MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
  LOW: "bg-slate-50 text-ink-muted border-line",
  PENDING: "bg-slate-50 text-ink-muted border-line",
  RUNNING: "bg-accent-soft text-accent-strong border-teal-200",
  FAILED: "bg-red-50 text-danger border-red-200",
  SUCCESS: "bg-emerald-50 text-success border-emerald-200",
  SKIPPED: "bg-slate-100 text-ink-faint border-line line-through",
  ACTIVE: "bg-accent-soft text-accent-strong border-teal-200",
  RESOLVED: "bg-emerald-50 text-success border-emerald-200",
};

export function StatusBadge({
  value,
  className = "",
}: {
  value: BadgeKind | string;
  className?: string;
}) {
  const style = styles[value] ?? "bg-slate-50 text-ink-muted border-line";
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wide ${style} ${className}`}
    >
      {value}
    </span>
  );
}
