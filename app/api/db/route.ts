import { NextResponse } from "next/server";
import { checkConnection, isDatabaseConfigured } from "@/lib/db/cockroach";
import { applySchema } from "@/lib/db/schema";

export const runtime = "nodejs";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { ok: false, configured: false, error: "DATABASE_URL is not set" },
      { status: 503 },
    );
  }

  try {
    const ok = await checkConnection();
    return NextResponse.json({ ok, configured: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Connection failed";
    return NextResponse.json(
      { ok: false, configured: true, error: message },
      { status: 503 },
    );
  }
}

export async function POST() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { ok: false, error: "DATABASE_URL is not set" },
      { status: 503 },
    );
  }

  try {
    await applySchema();
    return NextResponse.json({ ok: true, message: "Schema applied" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to apply schema";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
