import type { PoolClient } from "pg";
import { asQueryable, query } from "./cockroach";
import type { DbService } from "./types";

export async function upsertService(
  name: string,
  environment = "production",
  client?: PoolClient,
): Promise<DbService> {
  const sql = `
    INSERT INTO services (name, environment)
    VALUES ($1, $2)
    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
    RETURNING id, name, environment, created_at
  `;
  const result = await asQueryable(client).query<DbService>(sql, [name, environment]);
  return result.rows[0];
}

export async function getServiceByName(name: string): Promise<DbService | null> {
  const result = await query<DbService>(
    `SELECT id, name, environment, created_at FROM services WHERE name = $1`,
    [name],
  );
  return result.rows[0] ?? null;
}

export async function getServiceById(id: string): Promise<DbService | null> {
  const result = await query<DbService>(
    `SELECT id, name, environment, created_at FROM services WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function listServices(): Promise<DbService[]> {
  const result = await query<DbService>(
    `SELECT id, name, environment, created_at FROM services ORDER BY name ASC`,
  );
  return result.rows;
}
