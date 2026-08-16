import { NextResponse } from "next/server";
import {
  createEmbedding,
  isEmbeddingsConfigured,
} from "@/lib/ai/embeddings";
import { isDatabaseConfigured } from "@/lib/db/cockroach";
import { searchSimilarMemories } from "@/lib/db/memories";

export const runtime = "nodejs";

interface SearchBody {
  query?: string;
  limit?: number;
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        skipped: true,
        error: "DATABASE_URL is not set — vector search skipped",
      },
      { status: 503 },
    );
  }

  if (!isEmbeddingsConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        skipped: true,
        error:
          "AWS_REGION is not set — Bedrock embeddings unavailable; vector search skipped",
      },
      { status: 503 },
    );
  }

  let body: SearchBody;
  try {
    body = (await request.json()) as SearchBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const query = body.query?.trim();
  if (!query) {
    return NextResponse.json(
      { ok: false, error: "query is required" },
      { status: 400 },
    );
  }

  const limit =
    typeof body.limit === "number" && body.limit > 0
      ? Math.min(Math.floor(body.limit), 10)
      : 3;

  try {
    const embedding = await createEmbedding(query);
    const rows = await searchSimilarMemories(embedding, limit);
    const memories = rows.map((row) => ({
      id: row.id,
      similarity: row.similarity,
      service: row.service_name,
      summary: row.summary,
      successfulAction: row.successful_action,
      failedActions: row.failed_actions ?? [],
    }));

    return NextResponse.json({ ok: true, memories });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Vector search failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
