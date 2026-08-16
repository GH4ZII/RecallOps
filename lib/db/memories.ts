import type { PoolClient } from "pg";
import { toVectorLiteral } from "@/lib/ai/embeddings";
import { asQueryable, query } from "./cockroach";
import type { DbMemory, SimilarMemory } from "./types";

export interface SaveMemoryInput {
  incidentId: string;
  summary: string;
  rootCause: string;
  successfulAction: string;
  failedActions: string[];
  /** Float embedding; stored as VECTOR(1024). */
  embedding?: number[] | null;
}

const MEMORY_RETURNING = `
  id, incident_id, summary, root_cause, successful_action,
  failed_actions, embedding::STRING AS embedding, created_at
`;

export async function saveMemory(
  input: SaveMemoryInput,
  client?: PoolClient,
): Promise<DbMemory> {
  const embeddingLiteral =
    input.embedding && input.embedding.length > 0
      ? toVectorLiteral(input.embedding)
      : null;

  const sql = `
    INSERT INTO memories (
      incident_id, summary, root_cause, successful_action, failed_actions, embedding
    )
    VALUES ($1, $2, $3, $4, $5, $6::VECTOR)
    ON CONFLICT (incident_id) DO UPDATE SET
      summary = EXCLUDED.summary,
      root_cause = EXCLUDED.root_cause,
      successful_action = EXCLUDED.successful_action,
      failed_actions = EXCLUDED.failed_actions,
      embedding = COALESCE(EXCLUDED.embedding, memories.embedding)
    RETURNING ${MEMORY_RETURNING}
  `;

  const result = await asQueryable(client).query<DbMemory>(sql, [
    input.incidentId,
    input.summary,
    input.rootCause,
    input.successfulAction,
    input.failedActions,
    embeddingLiteral,
  ]);
  return result.rows[0];
}

export async function getMemoryByIncidentId(
  incidentId: string,
): Promise<DbMemory | null> {
  const result = await query<DbMemory>(
    `
    SELECT ${MEMORY_RETURNING}
    FROM memories
    WHERE incident_id = $1
    `,
    [incidentId],
  );
  return result.rows[0] ?? null;
}

export async function listMemories(limit = 50): Promise<
  Array<DbMemory & { service_name: string }>
> {
  const result = await query<DbMemory & { service_name: string }>(
    `
    SELECT
      m.id, m.incident_id, m.summary, m.root_cause, m.successful_action,
      m.failed_actions, m.embedding::STRING AS embedding, m.created_at,
      s.name AS service_name
    FROM memories m
    JOIN incidents i ON i.id = m.incident_id
    JOIN services s ON s.id = i.service_id
    ORDER BY m.created_at DESC
    LIMIT $1
    `,
    [limit],
  );
  return result.rows;
}

/**
 * Cosine similarity search over memory embeddings.
 * Similarity = 1 - (embedding <=> query) so higher is better.
 */
export async function searchSimilarMemories(
  embedding: number[],
  limit = 3,
  client?: PoolClient,
): Promise<SimilarMemory[]> {
  const literal = toVectorLiteral(embedding);
  const result = await asQueryable(client).query<SimilarMemory>(
    `
    SELECT
      m.id, m.incident_id, m.summary, m.root_cause, m.successful_action,
      m.failed_actions, m.embedding::STRING AS embedding, m.created_at,
      s.name AS service_name,
      (1 - (m.embedding <=> $1::VECTOR))::FLOAT8 AS similarity
    FROM memories m
    JOIN incidents i ON i.id = m.incident_id
    JOIN services s ON s.id = i.service_id
    WHERE m.embedding IS NOT NULL
    ORDER BY m.embedding <=> $1::VECTOR
    LIMIT $2
    `,
    [literal, limit],
  );
  return result.rows.map((row) => ({
    ...row,
    similarity: Number(row.similarity),
  }));
}
