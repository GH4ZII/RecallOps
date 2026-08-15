"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AgentDecision } from "@/components/AgentDecision";
import { AgentTimeline } from "@/components/AgentTimeline";
import { MemoryCard } from "@/components/MemoryCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useDemo } from "@/lib/demo/store";

export default function IncidentPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { getIncident, getRuntime, hydrated } = useDemo();

  const incident = getIncident(id);
  const runtime = getRuntime(id);

  if (!hydrated) {
    return <p className="text-sm text-ink-faint">Loading incident…</p>;
  }

  if (!incident || !runtime) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-ink">Incident not found</h1>
        <p className="text-ink-muted">
          Start a scenario from the dashboard to create an incident.
        </p>
        <Link href="/" className="text-sm font-semibold text-accent-strong hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 animate-fade-up">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-ink-faint">
            Incident / {incident.id}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">
            {incident.service}
          </h1>
          <p className="mt-2 max-w-2xl text-ink-muted">{incident.description}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge value={incident.severity} />
          <StatusBadge
            value={incident.status === "resolved" ? "RESOLVED" : "ACTIVE"}
          />
          {incident.latencyMs != null && (
            <p className="font-mono text-sm text-ink-muted">
              Latency: {incident.latencyMs}ms
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <AgentTimeline events={runtime.timeline} isLive={runtime.isSimulating} />

          <section className="rounded-lg border border-line bg-surface-raised p-5 shadow-soft">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-ink-muted">
              Memory retrieval
            </h2>
            {runtime.agentState === "IDLE" ||
            runtime.agentState === "DETECTED" ||
            runtime.agentState === "SEARCHING_MEMORY" ? (
              <p className="text-sm text-ink-faint">
                {runtime.agentState === "SEARCHING_MEMORY"
                  ? "Searching CockroachDB memory…"
                  : "Memory search has not started yet."}
              </p>
            ) : runtime.retrievedMemories.length === 0 ? (
              <p className="rounded-md border border-dashed border-line bg-surface px-4 py-6 text-sm text-ink-muted">
                No useful previous memory found. Agent will explore remediation
                options.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {runtime.retrievedMemories.map((memory) => (
                  <MemoryCard key={memory.id} variant="retrieved" memory={memory} />
                ))}
              </div>
            )}
          </section>
        </div>

        <AgentDecision decision={runtime.decision} actions={runtime.actions} />
      </div>

      <div className="flex gap-4 text-sm">
        <Link href="/" className="font-medium text-accent-strong hover:underline">
          ← Dashboard
        </Link>
        <Link href="/memory" className="font-medium text-ink-muted hover:underline">
          View memory store
        </Link>
      </div>
    </div>
  );
}
