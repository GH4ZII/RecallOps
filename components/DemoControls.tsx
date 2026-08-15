"use client";

import { useRouter } from "next/navigation";
import { useDemo } from "@/lib/demo/store";

export function DemoControls() {
  const router = useRouter();
  const { state, startScenario, resetDemo, hydrated } = useDemo();

  if (!hydrated) {
    return (
      <div className="rounded-lg border border-line bg-surface-raised p-5 shadow-soft">
        <p className="text-sm text-ink-faint">Loading demo session…</p>
      </div>
    );
  }

  const inc1Exists = state.incidents.some((i) => i.scenarioId === "incident-1");
  const inc2Exists = state.incidents.some((i) => i.scenarioId === "incident-2");
  const canRun2 = state.incident1Complete && !inc2Exists;

  const run = (id: "incident-1" | "incident-2") => {
    const incidentId = startScenario(id);
    if (incidentId) {
      router.push(`/incidents/${incidentId}`);
    }
  };

  return (
    <section className="rounded-lg border border-accent/25 bg-surface-raised p-5 shadow-soft">
      <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink-muted">
        Demo controls
      </h2>
      <p className="mt-2 text-sm text-ink-muted">
        Run Incident #1 first. After memory is stored, unlock Incident #2 to show
        recall-driven remediation.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => run("incident-1")}
          disabled={inc1Exists}
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {inc1Exists ? "Incident #1 running / done" : "Run Incident #1"}
        </button>
        <button
          type="button"
          onClick={() => run("incident-2")}
          disabled={!canRun2}
          className="rounded-md border border-accent bg-accent-soft px-4 py-2 text-sm font-semibold text-accent-strong transition hover:bg-teal-100 disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-muted disabled:text-ink-faint"
        >
          {inc2Exists
            ? "Incident #2 running / done"
            : state.incident1Complete
              ? "Run Incident #2"
              : "Run Incident #2 (locked)"}
        </button>
        <button
          type="button"
          onClick={resetDemo}
          className="rounded-md border border-line px-4 py-2 text-sm font-medium text-ink-muted transition hover:bg-surface-muted hover:text-ink"
        >
          Reset demo
        </button>
      </div>
    </section>
  );
}
