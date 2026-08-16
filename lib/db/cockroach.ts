import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";

declare global {
  var __recallopsPool: Pool | undefined;
}

export type Queryable = Pick<Pool | PoolClient, "query">;

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add a CockroachDB connection string to .env.local",
    );
  }

  return new Pool({
    connectionString,
    application_name: "recallops",
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
}

export function getPool(): Pool {
  if (!globalThis.__recallopsPool) {
    globalThis.__recallopsPool = createPool();
  }
  return globalThis.__recallopsPool;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<QueryResult<T>> {
  return getPool().query<T>(text, params);
}

export function asQueryable(client?: PoolClient): Queryable {
  return client ?? getPool();
}

/**
 * Run a transaction with CockroachDB serialization-failure retries (SQLSTATE 40001).
 */
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>,
  maxRetries = 5,
): Promise<T> {
  const pool = getPool();

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const result = await fn(client);
      await client.query("COMMIT");
      return result;
    } catch (err) {
      await client.query("ROLLBACK").catch(() => undefined);
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code: unknown }).code)
          : "";
      if (code === "40001" && attempt < maxRetries - 1) {
        const delay =
          Math.min(200 * 2 ** attempt, 5000) * (0.5 + Math.random() * 0.5);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw err;
    } finally {
      client.release();
    }
  }

  throw new Error("Transaction failed after max retries");
}

export async function checkConnection(): Promise<boolean> {
  const result = await query<{ ok: number | string }>("SELECT 1 AS ok");
  return Number(result.rows[0]?.ok) === 1;
}
