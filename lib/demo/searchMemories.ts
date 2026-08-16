import type { RetrievedMemory } from "./types";

/**
 * Client helper: semantic memory search via CockroachDB VECTOR + Bedrock embeddings.
 * Returns skipped when DB/embeddings are not configured so the demo can fall back to mocks.
 */
export async function searchDemoMemories(payload: {
  query: string;
  limit?: number;
}): Promise<{
  ok: boolean;
  skipped?: boolean;
  memories?: RetrievedMemory[];
  error?: string;
}> {
  try {
    const res = await fetch("/api/memories/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: payload.query,
        limit: payload.limit ?? 3,
      }),
    });
    const data = (await res.json()) as {
      ok: boolean;
      skipped?: boolean;
      memories?: RetrievedMemory[];
      error?: string;
    };
    if (!res.ok) {
      return {
        ok: false,
        skipped: data.skipped,
        error: data.error ?? `HTTP ${res.status}`,
      };
    }
    return { ok: true, memories: data.memories ?? [] };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Search request failed",
    };
  }
}
