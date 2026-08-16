import { existsSync, readFileSync } from "fs";
import path from "path";
import { Pool } from "pg";

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const text = readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.join(process.cwd(), ".env.local"));
loadEnvFile(path.join(process.cwd(), ".env"));

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and add your CockroachDB URL.",
    );
    process.exit(1);
  }

  const schemaPath = path.join(process.cwd(), "database", "schema.sql");
  const sql = readFileSync(schemaPath, "utf8");
  const statements = sql
    .split(";")
    .map((s) => s.replace(/--.*$/gm, "").trim())
    .filter(Boolean);

  const pool = new Pool({
    connectionString,
    application_name: "recallops-db-init",
  });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const statement of statements) {
      process.stdout.write(`→ ${statement.slice(0, 60).replace(/\s+/g, " ")}… `);
      await client.query(statement);
      console.log("ok");
    }
    await client.query("COMMIT");
    console.log("\nSchema applied successfully.");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error("\nFailed to apply schema:", err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
