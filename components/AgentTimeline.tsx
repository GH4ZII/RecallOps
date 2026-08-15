import type { TimelineEvent } from "@/lib/demo/types";

const toneClass: Record<NonNullable<TimelineEvent["tone"]>, string> = {
  neutral: "bg-ink-faint",
  success: "bg-success",
  danger: "bg-danger",
  accent: "bg-accent",
};

export function AgentTimeline({
  events,
  isLive,
}: {
  events: TimelineEvent[];
  isLive?: boolean;
}) {
  return (
    <section className="rounded-lg border border-line bg-surface-raised p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink-muted">
          Agent activity
        </h2>
        {isLive && (
          <span className="flex items-center gap-2 font-mono text-xs text-accent-strong">
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse-dot" />
            Live
          </span>
        )}
      </div>
      {events.length === 0 ? (
        <p className="text-sm text-ink-faint">Waiting for agent…</p>
      ) : (
        <ol className="space-y-3">
          {events.map((event, index) => (
            <li
              key={event.id}
              className="flex gap-3 animate-timeline-in"
              style={{ animationDelay: `${Math.min(index, 8) * 20}ms` }}
            >
              <span className="w-12 shrink-0 font-mono text-xs text-ink-faint">
                {event.at}
              </span>
              <span className="relative mt-1.5 flex flex-col items-center">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${toneClass[event.tone ?? "neutral"]}`}
                />
                {index < events.length - 1 && (
                  <span className="mt-1 w-px flex-1 bg-line" />
                )}
              </span>
              <div className="pb-2">
                <p className="text-sm text-ink">{event.label}</p>
                <p className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
                  {event.state}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
