import type { ActionResult, AgentDecision } from "@/lib/demo/types";
import { StatusBadge } from "./StatusBadge";

export function AgentDecision({
  decision,
  actions,
}: {
  decision: AgentDecision | null;
  actions: ActionResult[];
}) {
  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-line bg-surface-raised p-5 shadow-soft">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink-muted">
          Agent decision
        </h2>
        {!decision ? (
          <p className="mt-3 text-sm text-ink-faint">Awaiting reasoning…</p>
        ) : (
          <div className="mt-3 space-y-3 animate-fade-up">
            <div>
              <p className="text-xs text-ink-faint">Recommended action</p>
              <p className="mt-1 font-mono text-base font-semibold text-ink">
                {decision.recommendedAction}
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-faint">Confidence</p>
              <p className="mt-1 font-mono text-2xl font-semibold text-accent-strong">
                {Math.round(decision.confidence * 100)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-faint">Why</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                {decision.reasoning}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-line bg-surface-raised p-5 shadow-soft">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink-muted">
          Action results
        </h2>
        {actions.length === 0 ? (
          <p className="mt-3 text-sm text-ink-faint">No actions yet</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {actions.map((action) => (
              <li
                key={action.id}
                className="flex items-center justify-between gap-3 rounded-md border border-line/70 bg-surface px-3 py-2 animate-fade-up"
              >
                <span className="text-sm text-ink">{action.description}</span>
                <StatusBadge value={action.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
