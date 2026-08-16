import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/db/cockroach";
import { getServiceHistory } from "@/lib/db/history";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { ok: false, error: "DATABASE_URL is not set" },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const service = searchParams.get("service");
  if (!service) {
    return NextResponse.json(
      { ok: false, error: "Query param `service` (id or name) is required" },
      { status: 400 },
    );
  }

  try {
    const history = await getServiceHistory(service);
    if (!history) {
      return NextResponse.json(
        { ok: false, error: `Service not found: ${service}` },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true, history });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load history";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
