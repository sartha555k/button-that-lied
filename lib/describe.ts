import type { SessionEvent } from "./types";

const NAMES: Record<string, string> = {
  "btn-place-order": "'Place order' button",
  "btn-apply-promo": "'Apply' promo button",
  "promo-input": "promo code field",
  "size-M": "size M",
  "field-name": "name field",
  "field-email": "email field",
  "field-addr": "street address field",
  "field-city": "city field",
  "field-zip": "ZIP field",
  "ship-express": "Express shipping option",
  "size-group": "size selector",
  "promo-row": "promo row",
  "total-row": "order total",
};

const n = (t?: string) => (t ? NAMES[t] ?? t : "");

export function fmtT(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

export function describe(e: SessionEvent): { icon: string; text: string; bad: boolean } {
  const p = (e.payload ?? {}) as Record<string, unknown>;
  switch (e.kind) {
    case "move":
      return { icon: "->", text: `Moves to ${n(e.target)}`, bad: false };
    case "click":
      if (p.result === "noop") return { icon: "x", text: `Clicks ${n(e.target)} - nothing happens`, bad: true };
      if (p.result === "error-shown") return { icon: "!", text: `Clicks ${n(e.target)} - an answer appears: ${String(p.reason ?? "")}`, bad: false };
      return { icon: "ok", text: `Clicks ${n(e.target)}`, bad: false };
    case "type":
      return { icon: p.refill ? "<<" : "ab", text: `${p.refill ? "RE-TYPES" : "Types"} "${String(p.text ?? "")}" into ${n(e.target)}`, bad: !!p.refill };
    case "select":
      return { icon: "o", text: `Selects ${n(e.target)}`, bad: false };
    case "feedback":
      return { icon: p.tone === "error" ? "!" : "ok", text: String(p.message ?? ""), bad: p.tone === "error" };
    case "wipe":
      return { icon: "x", text: `Form re-renders - ${(p.fields as string[]).map((f) => n(f)).join(", ")} cleared. Typed data lost.`, bad: true };
    case "total":
      return { icon: "$", text: `Total becomes $${String(p.total)} (${String(p.delta ?? "")})`, bad: true };
    case "pause":
      return { icon: "..", text: `Pauses - ${String(p.note ?? "")}`, bad: false };
    case "end":
      return p.outcome === "abandoned"
        ? { icon: "x", text: `Leaves without buying - ${String(p.reason ?? "")}`, bad: true }
        : { icon: "ok", text: `Order placed - ${String(p.reason ?? "")}`, bad: false };
    default:
      return { icon: "?", text: e.kind, bad: false };
  }
}
