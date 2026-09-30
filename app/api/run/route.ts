import { NextResponse } from "next/server";
import { scriptFor } from "@/lib/scripts";
import { deriveInsights, summarize } from "@/lib/insights";
import { insertRun, insertEvents, insertInsights } from "@/lib/db";
import type { Flow } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { flow?: Flow };
  const flow: Flow = body.flow === "fixed" ? "fixed" : "broken";
  const events = scriptFor(flow);
  const insights = deriveInsights(events);
  const s = summarize(events);
  const runId = await insertRun(flow, s.outcome, s.failedClicks, s.refills, s.durationMs);
  await insertEvents(runId, events);
  await insertInsights(runId, insights);
  return NextResponse.json({
    run: { id: runId, flow, outcome: s.outcome, failed_clicks: s.failedClicks, refills: s.refills, duration_ms: s.durationMs },
    events,
    insights,
  });
}
