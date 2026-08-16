import type { PoolClient } from "pg";
import { toVectorLiteral } from "@/lib/ai/embeddings";
import { asQueryable, query } from "./cockroach";
import type { DbIncident, DbIncidentStatus, IncidentWithService } from "./types";

export interface SaveIncidentInput {
  serviceId: string;
  title: string;
  description: string;
  severity: string;
  status?: DbIncidentStatus;
  startedAt?: string | Date;
  resolvedAt?: string | Date | null;
  externalId?: string | null;
  /** Float embedding; stored as VECTOR(1024). */
  embedding?: number[] | null;
}

const INCIDENT_RETURNING = `
  id, service_id, title, description, severity, status,
  started_at, resolved_at, external_id, embedding::STRING AS embedding,
  created_at, updated_at
`;

export async function saveIncident(
  input: SaveIncidentInput,
  client?: PoolClient,
): Promise<DbIncident> {
  const status = input.status ?? "pending";
  const startedAt = input.startedAt ?? new Date();
  const resolvedAt = input.resolvedAt ?? null;
  const externalId = input.externalId ?? null;
  const embeddingLiteral =
    input.embedding && input.embedding.length > 0
      ? toVectorLiteral(input.embedding)
      : null;

  const sql = `
    INSERT INTO incidents (
      service_id, title, description, severity, status,
      started_at, resolved_at, external_id, embedding, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::VECTOR, now())
    ON CONFLICT (external_id) DO UPDATE SET
      service_id = EXCLUDED.service_id,
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      severity = EXCLUDED.severity,
      status = EXCLUDED.status,
      started_at = EXCLUDED.started_at,
      resolved_at = EXCLUDED.resolved_at,
      embedding = COALESCE(EXCLUDED.embedding, incidents.embedding),
      updated_at = now()
    RETURNING ${INCIDENT_RETURNING}
  `;

  const result = await asQueryable(client).query<DbIncident>(sql, [
    input.serviceId,
    input.title,
    input.description,
    input.severity,
    status,
    startedAt,
    resolvedAt,
    externalId,
    embeddingLiteral,
  ]);
  return result.rows[0];
}

export async function updateIncidentStatus(
  id: string,
  status: DbIncidentStatus,
  resolvedAt?: string | Date | null,
  client?: PoolClient,
): Promise<DbIncident | null> {
  const sql = `
    UPDATE incidents
    SET status = $2,
        resolved_at = COALESCE($3, resolved_at),
        updated_at = now()
    WHERE id = $1
    RETURNING ${INCIDENT_RETURNING}
  `;
  const result = await asQueryable(client).query<DbIncident>(sql, [
    id,
    status,
    resolvedAt ?? null,
  ]);
  return result.rows[0] ?? null;
}

export async function getIncidentById(id: string): Promise<IncidentWithService | null> {
  const result = await query<IncidentWithService>(
    `
    SELECT
      i.id, i.service_id, i.title, i.description, i.severity, i.status,
      i.started_at, i.resolved_at, i.external_id,
      i.embedding::STRING AS embedding, i.created_at, i.updated_at,
      s.name AS service_name,
      s.environment AS service_environment
    FROM incidents i
    JOIN services s ON s.id = i.service_id
    WHERE i.id = $1 OR i.external_id = $1
    `,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function listIncidents(limit = 50): Promise<IncidentWithService[]> {
  const result = await query<IncidentWithService>(
    `
    SELECT
      i.id, i.service_id, i.title, i.description, i.severity, i.status,
      i.started_at, i.resolved_at, i.external_id,
      i.embedding::STRING AS embedding, i.created_at, i.updated_at,
      s.name AS service_name,
      s.environment AS service_environment
    FROM incidents i
    JOIN services s ON s.id = i.service_id
    ORDER BY i.started_at DESC
    LIMIT $1
    `,
    [limit],
  );
  return result.rows;
}

export async function getIncidentsByServiceId(
  serviceId: string,
): Promise<IncidentWithService[]> {
  const result = await query<IncidentWithService>(
    `
    SELECT
      i.id, i.service_id, i.title, i.description, i.severity, i.status,
      i.started_at, i.resolved_at, i.external_id,
      i.embedding::STRING AS embedding, i.created_at, i.updated_at,
      s.name AS service_name,
      s.environment AS service_environment
    FROM incidents i
    JOIN services s ON s.id = i.service_id
    WHERE i.service_id = $1
    ORDER BY i.started_at DESC
    `,
    [serviceId],
  );
  return result.rows;
}
