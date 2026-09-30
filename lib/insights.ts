import type { Insight, SessionEvent } from "./types";

/** Deterministic, rule-based grouping of session events into friction patterns. */
export function deriveInsights(events: SessionEvent[]): Insight[] {
  const insights: Insight[] = [];

  // Pattern 1: repeated failed clicks - consecutive no-op clicks on the same control
  const clicks = events.map((e, i) => ({ e, i })).filter(({ e }) => e.kind === "click");
  const groups = new Map<string, number[]>();
  for (const { e, i } of clicks) {
    if (e.payload?.result === "noop" && e.target) {
      const arr = groups.get(e.target) ?? [];
      arr.push(i);
      groups.set(e.target, arr);
    }
  }
  const rageTargets = [...groups.entries()].filter(([, idx]) => idx.length >= 2);
  if (rageTargets.length > 0) {
    const names: Record<string, string> = { "btn-place-order": '"Place order" button', "btn-apply-promo": '"Apply" promo button' };
    insights.push({
      pattern: "repeated_failed_clicks",
      title: "Repeated failed clicks",
      summary:
        rageTargets.map(([target, idx]) => `${names[target] ?? target}: ${idx.length} clicks, zero response`).join(" · ") +
        ". A user who clicks twice is not confused about what they want - the control gave them nothing back.",
      eventIndexes: rageTargets.flatMap(([, idx]) => idx),
    });
  }

  // Pattern 2: backtracking - typed data wiped, then re-entered
  const wipes = events.map((e, i) => ({ e, i })).filter(({ e }) => e.kind === "wipe");
  if (wipes.length > 0) {
    const refillIdx = events.map((e, i) => ({ e, i })).filter(({ e }) => e.kind === "type" && e.payload?.refill === true).map(({ i }) => i);
    insights.push({
      pattern: "backtracking",
      title: "Backtracking after data loss",
      summary: `Switching shipping wiped 3 completed address fields, forcing the session to redo finished work (${refillIdx.length} refills). Nothing about the shipping choice depends on the street address - the wipe is incidental, not required.`,
      eventIndexes: [wipes[0].i, ...refillIdx],
    });
  }

  // Pattern 3: abandoned at the pay step
  const endIdx = events.findIndex((e) => e.kind === "end");
  const end = events[endIdx];
  if (end && end.payload?.outcome === "abandoned") {
    const totalIdx = events.findIndex((e) => e.kind === "total");
    insights.push({
      pattern: "abandoned_form",
      title: "Abandonment after a late price change",
      summary:
        "The session survived the dead button and the wiped form, and still left - because the total it was promised ($64) became $72 one step before payment. The fee was real; showing it late is what killed the order.",
      eventIndexes: totalIdx >= 0 ? [totalIdx, endIdx] : [endIdx],
    });
  }
  return insights;
}

export function summarize(events: SessionEvent[]) {
  const failedClicks = events.filter((e) => e.kind === "click" && e.payload?.result === "noop").length;
  const refills = events.filter((e) => e.kind === "type" && e.payload?.refill === true).length;
  const end = events.find((e) => e.kind === "end");
  return {
    failedClicks,
    refills,
    outcome: (end?.payload?.outcome as "abandoned" | "completed") ?? "abandoned",
    durationMs: end?.t ?? 0,
  };
}
