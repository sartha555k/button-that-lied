import type { Flow, SessionEvent } from "./types";

/**
 * Fully deterministic scripted sessions. The same fictional persona -
 * "Sam, wants a Medium Nimbus Hoodie, has an expired promo code WELCOME10" -
 * runs through both flows. Nothing here is recorded from a real user.
 */

const PERSONA = {
  name: "Sam Rao",
  email: "sam.rao@example.com",
  addr: "14 Meridian Street",
  city: "Austin",
  zip: "78701",
  promo: "WELCOME10",
};

export function scriptFor(flow: Flow): SessionEvent[] {
  const ev: SessionEvent[] = [];
  let t = 300;
  const at = (d: number) => (t += d);

  if (flow === "broken") {
    ev.push({ t: at(0), kind: "move", target: "btn-place-order" });
    ev.push({ t: at(700), kind: "click", target: "btn-place-order", payload: { result: "noop", reason: "no size selected - no error shown" } });
    ev.push({ t: at(1100), kind: "pause", payload: { note: "hesitates" } });
    ev.push({ t: at(900), kind: "click", target: "btn-place-order", payload: { result: "noop", reason: "still no feedback" } });
    ev.push({ t: at(800), kind: "move", target: "promo-input" });
    ev.push({ t: at(500), kind: "type", target: "promo-input", payload: { text: PERSONA.promo } });
    ev.push({ t: at(900), kind: "click", target: "btn-apply-promo", payload: { result: "noop", reason: "expired code - silently ignored" } });
    ev.push({ t: at(1200), kind: "click", target: "btn-apply-promo", payload: { result: "noop", reason: "still silent" } });
    ev.push({ t: at(700), kind: "move", target: "size-M" });
    ev.push({ t: at(600), kind: "select", target: "size-M", payload: { value: "M" } });
    ev.push({ t: at(600), kind: "move", target: "field-name" });
    ev.push({ t: at(400), kind: "type", target: "field-name", payload: { text: PERSONA.name } });
    ev.push({ t: at(500), kind: "type", target: "field-email", payload: { text: PERSONA.email } });
    ev.push({ t: at(600), kind: "type", target: "field-addr", payload: { text: PERSONA.addr } });
    ev.push({ t: at(500), kind: "type", target: "field-city", payload: { text: PERSONA.city } });
    ev.push({ t: at(400), kind: "type", target: "field-zip", payload: { text: PERSONA.zip } });
    ev.push({ t: at(700), kind: "move", target: "ship-express" });
    ev.push({ t: at(600), kind: "select", target: "ship-express", payload: { value: "express" } });
    ev.push({ t: at(250), kind: "wipe", payload: { fields: ["field-addr", "field-city", "field-zip"], reason: "shipping change re-renders the form and loses typed data" } });
    ev.push({ t: at(900), kind: "total", payload: { total: 72, delta: "+$8.00 express handling - first time the fee is visible" } });
    ev.push({ t: at(800), kind: "pause", payload: { note: "re-reads the form" } });
    ev.push({ t: at(700), kind: "type", target: "field-addr", payload: { text: PERSONA.addr, refill: true } });
    ev.push({ t: at(500), kind: "type", target: "field-city", payload: { text: PERSONA.city, refill: true } });
    ev.push({ t: at(400), kind: "type", target: "field-zip", payload: { text: PERSONA.zip, refill: true } });
    ev.push({ t: at(600), kind: "move", target: "btn-place-order" });
    ev.push({ t: at(900), kind: "pause", payload: { note: "total says $72 - the button promised $64" } });
    ev.push({ t: at(1200), kind: "end", payload: { outcome: "abandoned", reason: "price jumped $64 -> $72 at the last step, after the form already ate the address once" } });
  } else {
    ev.push({ t: at(0), kind: "move", target: "btn-place-order" });
    ev.push({ t: at(700), kind: "click", target: "btn-place-order", payload: { result: "error-shown", reason: "size required" } });
    ev.push({ t: at(300), kind: "feedback", target: "size-group", payload: { message: "Pick a size to continue", tone: "error" } });
    ev.push({ t: at(900), kind: "move", target: "size-M" });
    ev.push({ t: at(600), kind: "select", target: "size-M", payload: { value: "M" } });
    ev.push({ t: at(500), kind: "move", target: "promo-input" });
    ev.push({ t: at(500), kind: "type", target: "promo-input", payload: { text: PERSONA.promo } });
    ev.push({ t: at(700), kind: "click", target: "btn-apply-promo", payload: { result: "error-shown", reason: "code expired" } });
    ev.push({ t: at(250), kind: "feedback", target: "promo-row", payload: { message: "WELCOME10 expired on Mar 1 - remove", tone: "error" } });
    ev.push({ t: at(900), kind: "move", target: "field-name" });
    ev.push({ t: at(400), kind: "type", target: "field-name", payload: { text: PERSONA.name } });
    ev.push({ t: at(500), kind: "type", target: "field-email", payload: { text: PERSONA.email } });
    ev.push({ t: at(600), kind: "type", target: "field-addr", payload: { text: PERSONA.addr } });
    ev.push({ t: at(500), kind: "type", target: "field-city", payload: { text: PERSONA.city } });
    ev.push({ t: at(400), kind: "type", target: "field-zip", payload: { text: PERSONA.zip } });
    ev.push({ t: at(700), kind: "move", target: "ship-express" });
    ev.push({ t: at(600), kind: "select", target: "ship-express", payload: { value: "express" } });
    ev.push({ t: at(300), kind: "total", payload: { total: 72, delta: "+$8.00 express handling - shown inline before payment", preserved: true } });
    ev.push({ t: at(300), kind: "feedback", target: "ship-express", payload: { message: "Address kept. Total updated before you pay.", tone: "success" } });
    ev.push({ t: at(900), kind: "move", target: "btn-place-order" });
    ev.push({ t: at(700), kind: "click", target: "btn-place-order", payload: { result: "ok" } });
    ev.push({ t: at(900), kind: "end", payload: { outcome: "completed", reason: "order placed - every failure point answered at the moment it happened" } });
  }
  return ev;
}
