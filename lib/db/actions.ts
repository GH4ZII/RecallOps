import type { PoolClient } from "pg";
import { asQueryable, query } from "./cockroach";
import type { DbAction, DbActionStatus } from "./types";

export interface SaveActionInput {
  incidentId: string;
  actionType: string;
  description: string;
  status: DbActionStatus;
  startedAt?: string | Date;
  completedAt?: string | Date | null;
  externalId?: string | null;
}

export async function saveAction(
  input: SaveActionInput,
  client?: PoolClient,
): Promise<DbAction> {
  const startedAt = input.startedAt ?? new Date();
  const completedAt =
    input.completedAt ??
    (input.status === "PENDING" || input.status === "RUNNING" ? null : new Date());
  const externalId = input.externalId ?? null;

  const sql = `
    INSERT INTO actions (
      incident_id, action_type, description, status,
      started_at, completed_at, external_id
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (incident_id, external_id) DO UPDATE SET
      action_type = EXCLUDED.action_type,
      description = EXCLUDED.description,
      status = EXCLUDED.status,
      started_at = EXCLUDED.started_at,
      completed_at = EXCLUDED.completed_at
    RETURNING
      id, incident_id, action_type, description, status,
      started_at, completed_at, external_id, created_at
  `;

  const result = await asQueryable(client).query<DbAction>(sql, [
    input.incidentId,
    input.actionType,
    input.description,
    input.status,
    startedAt,
    completedAt,
    externalId,
  ]);
  return result.rows[0];
}

export async function getActionsByIncidentId(
  incidentId: string,
): Promise<DbAction[]> {
  const result = await query<DbAction>(
    `
    SELECT
      id, incident_id, action_type, description, status,
      started_at, completed_at, external_id, created_at
    FROM actions
    WHERE incident_id = $1
    ORDER BY started_at ASC, created_at ASC
    `,
    [incidentId],
  );
  return result.rows;
}

export async function getActionsByStatus(
  incidentId: string,
  status: DbActionStatus,
): Promise<DbAction[]> {
  const result = await query<DbAction>(
    `
    SELECT
      id, incident_id, action_type, description, status,
      started_at, completed_at, external_id, created_at
    FROM actions
    WHERE incident_id = $1 AND status = $2
    ORDER BY started_at ASC
    `,
    [incidentId, status],
  );
  return result.rows;
}
