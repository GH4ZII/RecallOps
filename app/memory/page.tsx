"use client";

import { MemoryCard } from "@/components/MemoryCard";
import { useDemo } from "@/lib/demo/store";

export default function MemoryPage() {
  const { state, hydrated } = useDemo();

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="text-3xl font-bold tracking-tight text-ink">
          Agent memory
        </h1>
        <p className="mt-2 max-w-2xl text-ink-muted">
          Long-term operational memory stored after each incident. Future
          responses reuse what failed and what worked.
        </p>
      </div>

      {!hydrated ? (
        <p className="text-sm text-ink-faint">Loading memories…</p>
      ) : state.memories.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line bg-surface-raised/60 p-8 text-sm text-ink-faint">
          No memories yet. Run Incident #1 to store the first experience.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {state.memories.map((memory, index) => (
            <MemoryCard
              key={memory.id}
              variant="stored"
              memory={memory}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
}
