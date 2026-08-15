import Link from "next/link";
import { StatusBadge } from "./StatusBadge";
import type { Incident } from "@/lib/demo/types";

export function IncidentCard({ incident }: { incident: Incident }) {
  return (
    <Link
      href={`/incidents/${incident.id}`}
      className="block rounded-lg border border-line bg-surface-raised p-4 shadow-soft transition hover:border-accent/40 hover:shadow-md animate-fade-up"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-ink-faint">{incident.service}</p>
          <h3 className="mt-1 text-base font-semibold text-ink">{incident.title}</h3>
        </div>
        <StatusBadge value={incident.severity} />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <StatusBadge
          value={incident.status === "resolved" ? "RESOLVED" : "ACTIVE"}
        />
        {incident.latencyMs != null && (
          <span className="font-mono text-xs text-ink-muted">
            Latency: {incident.latencyMs}ms
          </span>
        )}
        {incident.resolutionSeconds != null && (
          <span className="font-mono text-xs text-ink-muted">
            Resolved in {incident.resolutionSeconds}s
          </span>
        )}
      </div>
    </Link>
  );
}
