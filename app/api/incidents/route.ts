import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/db/cockroach";
import { listIncidents } from "@/lib/db/incidents";

export const runtime = "nodejs";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { ok: false, error: "DATABASE_URL is not set" },
      { status: 503 },
    );
  }

  try {
    const incidents = await listIncidents();
    return NextResponse.json({ ok: true, incidents });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list incidents";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
