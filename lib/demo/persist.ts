/**
 * Client helper: persist a completed demo incident to CockroachDB.
 * No-ops gracefully when the DB is not configured.
 */
export async function persistDemoIncident(payload: {
  serviceName: string;
  incident: {
    externalId: string;
    title: string;
    description: string;
    severity: string;
    status: "pending" | "active" | "resolved";
    startedAt: string;
    resolvedAt?: string | null;
  };
  actions: Array<{
    externalId: string;
    actionType: string;
    description: string;
    status: "PENDING" | "RUNNING" | "FAILED" | "SUCCESS" | "SKIPPED";
  }>;
  memory?: {
    summary: string;
    rootCause: string;
    successfulAction: string;
    failedActions: string[];
  } | null;
}): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  try {
    const res = await fetch("/api/persist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as {
      ok: boolean;
      skipped?: boolean;
      error?: string;
    };
    if (!res.ok) {
      return {
        ok: false,
        skipped: data.skipped,
        error: data.error ?? `HTTP ${res.status}`,
      };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Persist request failed",
    };
  }
}
