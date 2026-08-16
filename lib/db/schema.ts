import { readFile } from "fs/promises";
import path from "path";
import { getPool, withTransaction } from "./cockroach";

/**
 * Apply database/schema.sql to the connected CockroachDB cluster.
 */
export async function applySchema(): Promise<void> {
  const schemaPath = path.join(process.cwd(), "database", "schema.sql");
  const sql = await readFile(schemaPath, "utf8");

  // Split on semicolons at end of statements; keep simple for our schema file.
  const statements = sql
    .split(";")
    .map((s) => s.replace(/--.*$/gm, "").trim())
    .filter(Boolean);

  await withTransaction(async (client) => {
    for (const statement of statements) {
      await client.query(statement);
    }
  });
}

export async function resetDemoData(): Promise<void> {
  const pool = getPool();
  await pool.query(`
    TRUNCATE memories, actions, incidents, services CASCADE
  `);
}
