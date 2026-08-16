import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/db/cockroach";
import {
  persistIncidentOutcome,
  type PersistIncidentOutcomeInput,
} from "@/lib/db/persist";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        skipped: true,
        error: "DATABASE_URL is not set — persistence skipped",
      },
      { status: 503 },
    );
  }

  let body: PersistIncidentOutcomeInput;
  try {
    body = (await request.json()) as PersistIncidentOutcomeInput;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body?.serviceName || !body?.incident?.externalId) {
    return NextResponse.json(
      { ok: false, error: "serviceName and incident.externalId are required" },
      { status: 400 },
    );
  }

  try {
    const result = await persistIncidentOutcome(body);
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Persist failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
