export type Flow = "broken" | "fixed";

export type EventKind = "move" | "click" | "type" | "select" | "feedback" | "wipe" | "total" | "pause" | "end";

export interface SessionEvent {
  t: number; // ms offset in the run
  kind: EventKind;
  target?: string; // element id in the mock checkout
  payload?: Record<string, unknown>;
}

export interface Run {
  id: number;
  flow: Flow;
  outcome: "abandoned" | "completed";
  failed_clicks: number;
  refills: number;
  duration_ms: number;
  created_at?: string;
}

export type Pattern = "repeated_failed_clicks" | "backtracking" | "abandoned_form";

export interface Insight {
  pattern: Pattern;
  title: string;
  summary: string;
  eventIndexes: number[];
}
