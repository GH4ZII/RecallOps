"use client";

import { DemoControls } from "@/components/DemoControls";
import { IncidentCard } from "@/components/IncidentCard";
import { useDemo } from "@/lib/demo/store";

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-surface-raised p-4 shadow-soft">
      <p className="text-xs uppercase tracking-[0.14em] text-ink-faint">{label}</p>
      <p className="mt-2 font-mono text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { state, metrics, hydrated } = useDemo();

  const active = state.incidents.filter((i) => i.status === "active");
  const resolved = state.incidents.filter((i) => i.status === "resolved");

  return (
    <div className="space-y-8">
      <div className="animate-fade-up">
        <h1 className="text-3xl font-bold tracking-tight text-ink">
          Operations dashboard
        </h1>
        <p className="mt-2 max-w-2xl text-ink-muted">
          Watch RecallOps detect incidents, search long-term memory, and improve
          remediation after every outcome.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Metric label="Active incidents" value={String(metrics.activeCount)} />
        <Metric label="Resolved incidents" value={String(metrics.resolvedCount)} />
        <Metric
          label="Mean resolution time"
          value={
            metrics.meanResolutionSeconds == null
              ? "—"
              : `${metrics.meanResolutionSeconds}s`
          }
        />
        <Metric label="Memories stored" value={String(metrics.memoriesStored)} />
        <Metric label="Actions avoided" value={String(metrics.actionsAvoided)} />
      </div>

      <DemoControls />

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-ink-muted">
            Active incidents
          </h2>
          {!hydrated ? (
            <p className="text-sm text-ink-faint">Loading…</p>
          ) : active.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line bg-surface-raised/60 p-6 text-sm text-ink-faint">
              No active incidents. Start Incident #1 from demo controls.
            </p>
          ) : (
            <div className="space-y-3">
              {active.map((incident) => (
                <IncidentCard key={incident.id} incident={incident} />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-ink-muted">
            Resolved incidents
          </h2>
          {!hydrated ? (
            <p className="text-sm text-ink-faint">Loading…</p>
          ) : resolved.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line bg-surface-raised/60 p-6 text-sm text-ink-faint">
              Resolved incidents will appear here.
            </p>
          ) : (
            <div className="space-y-3">
              {resolved.map((incident) => (
                <IncidentCard key={incident.id} incident={incident} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
