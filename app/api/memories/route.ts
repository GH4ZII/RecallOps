import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/db/cockroach";
import { listMemories } from "@/lib/db/memories";

export const runtime = "nodejs";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { ok: false, error: "DATABASE_URL is not set" },
      { status: 503 },
    );
  }

  try {
    const memories = await listMemories();
    return NextResponse.json({ ok: true, memories });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list memories";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
