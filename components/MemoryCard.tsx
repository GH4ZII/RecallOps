import type { Memory, RetrievedMemory } from "@/lib/demo/types";

type MemoryCardProps =
  | { variant: "retrieved"; memory: RetrievedMemory }
  | { variant: "stored"; memory: Memory; index?: number };

export function MemoryCard(props: MemoryCardProps) {
  if (props.variant === "retrieved") {
    const { memory } = props;
    const pct = Math.round(memory.similarity * 100);
    return (
      <article className="rounded-lg border border-line bg-surface-raised p-4 shadow-soft animate-fade-up">
        <div className="flex items-baseline justify-between gap-2">
          <p className="font-mono text-lg font-semibold text-accent-strong">
            {pct}% match
          </p>
          <p className="font-mono text-xs text-ink-faint">{memory.service}</p>
        </div>
        <h3 className="mt-2 text-sm font-semibold text-ink">{memory.summary}</h3>
        <dl className="mt-3 space-y-1 text-sm">
          <div>
            <dt className="inline text-ink-faint">Successful: </dt>
            <dd className="inline text-success">{memory.successfulAction}</dd>
          </div>
          <div>
            <dt className="inline text-ink-faint">Failed: </dt>
            <dd className="inline text-danger">{memory.failedActions.join(", ")}</dd>
          </div>
        </dl>
      </article>
    );
  }

  const { memory, index } = props;
  return (
    <article className="rounded-lg border border-line bg-surface-raised p-5 shadow-soft animate-fade-up">
      <p className="font-mono text-xs uppercase tracking-[0.14em] text-ink-faint">
        Memory #{String((index ?? 0) + 1).padStart(3, "0")}
      </p>
      <h3 className="mt-2 text-lg font-semibold text-ink">{memory.service}</h3>
      <p className="mt-1 text-sm font-medium text-accent-strong">{memory.rootCause}</p>
      <p className="mt-3 text-sm leading-relaxed text-ink-muted">{memory.summary}</p>
      <div className="mt-4 grid gap-2 border-t border-line pt-3 text-sm">
        <p>
          <span className="text-ink-faint">Learned success: </span>
          <span className="text-success">{memory.successfulAction}</span>
        </p>
        {memory.failedActions.length > 0 && (
          <p>
            <span className="text-ink-faint">Did not help: </span>
            <span className="text-danger">{memory.failedActions.join(", ")}</span>
          </p>
        )}
      </div>
    </article>
  );
}
