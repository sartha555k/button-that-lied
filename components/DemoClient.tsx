"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Flow, Insight, Run, SessionEvent } from "@/lib/types";
import CheckoutMock, { CheckoutState, INITIAL_CHECKOUT } from "./CheckoutMock";
import CursorLayer from "./CursorLayer";
import EvidencePanel from "./EvidencePanel";

const SPEED = 0.8;

export default function DemoClient() {
  const [flow, setFlow] = useState<Flow>("broken");
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [played, setPlayed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [checkout, setCheckout] = useState<CheckoutState>(INITIAL_CHECKOUT);
  const [cursor, setCursor] = useState({ x: 0, y: 0, visible: false });
  const [ripple, setRipple] = useState(0);
  const [highlight, setHighlight] = useState<Set<number>>(new Set());
  const [history, setHistory] = useState<Run[]>([]);
  const [runKey, setRunKey] = useState(0);

  const timers = useRef<number[]>([]);
  const stageRef = useRef<HTMLDivElement>(null);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  const refreshHistory = useCallback(() => {
    fetch("/api/runs").then((r) => r.json()).then((d) => setHistory(d.runs ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    refreshHistory();
    const params = new URLSearchParams(window.location.search);
    const f = params.get("flow");
    if (f === "fixed") setFlow("fixed");
    if (params.get("autorun") === "1") {
      const t = window.setTimeout(() => start(f === "fixed" ? "fixed" : "broken"), 700);
      return () => window.clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const moveCursorTo = useCallback((target?: string) => {
    const stage = stageRef.current;
    if (!stage) return;
    const el = target ? stage.querySelector(`#${CSS.escape(target)}`) : null;
    if (!el) return;
    const sr = stage.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    setCursor({ x: r.left - sr.left + r.width / 2, y: r.top - sr.top + Math.min(r.height / 2, 20), visible: true });
  }, []);

  const applyEvent = useCallback(
    (ev: SessionEvent, idx: number) => {
      if (ev.target) moveCursorTo(ev.target);
      if (ev.kind === "click") setRipple(idx + 1);
      setCheckout((s) => {
        const p = (ev.payload ?? {}) as Record<string, unknown>;
        switch (ev.kind) {
          case "select":
            if (ev.target?.startsWith("size-")) return { ...s, size: String(p.value), sizeError: false };
            if (ev.target?.startsWith("ship-")) return { ...s, shipping: p.value as "standard" | "express" };
            return s;
          case "click":
            if (ev.target === "btn-place-order" && p.result === "error-shown") return { ...s, sizeError: true };
            if (ev.target === "btn-place-order" && p.result === "ok") return { ...s, orderPlaced: true };
            return s;
          case "feedback":
            return { ...s, feedback: [...s.feedback, { key: idx, target: ev.target ?? "", message: String(p.message), tone: p.tone as "error" | "success" | "info" }] };
          case "type": {
            const map: Record<string, keyof CheckoutState> = {
              "promo-input": "promoText",
              "field-name": "name",
              "field-email": "email",
              "field-addr": "addr",
              "field-city": "city",
              "field-zip": "zip",
            };
            const field = map[ev.target ?? ""];
            return field ? { ...s, [field]: String(p.text ?? "") } : s;
          }
          case "wipe":
            return { ...s, addr: "", city: "", zip: "" };
          case "total":
            return { ...s, total: Number(p.total), totalNote: String(p.delta ?? "") };
          case "end":
            return { ...s, outcome: p.outcome as "abandoned" | "completed", outcomeReason: String(p.reason ?? "") };
          default:
            return s;
        }
      });
    },
    [moveCursorTo]
  );

  const start = useCallback(
    async (f: Flow) => {
      clearTimers();
      setFlow(f);
      setCheckout(INITIAL_CHECKOUT);
      setEvents([]);
      setInsights([]);
      setPlayed(0);
      setHighlight(new Set());
      setRipple(0);
      setCursor((c) => ({ ...c, visible: false }));
      setRunKey((k) => k + 1);
      setPlaying(true);
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ flow: f }),
      });
      const data = (await res.json()) as { events: SessionEvent[]; insights: Insight[] };
      setEvents(data.events);
      setInsights(data.insights);
      data.events.forEach((ev, i) => {
        const t = window.setTimeout(() => {
          applyEvent(ev, i);
          setPlayed(i + 1);
          if (i === data.events.length - 1) {
            setPlaying(false);
            refreshHistory();
          }
        }, (ev.t - data.events[0].t) * SPEED + 500);
        timers.current.push(t);
      });
    },
    [applyEvent, refreshHistory]
  );

  const skip = useCallback(() => {
    clearTimers();
    events.forEach((ev, i) => applyEvent(ev, i));
    setPlayed(events.length);
    setPlaying(false);
    refreshHistory();
  }, [events, applyEvent, refreshHistory]);

  const toggleInsight = useCallback((ins: Insight) => {
    setHighlight((h) => {
      const next = new Set(h);
      const allIn = ins.eventIndexes.every((i) => next.has(i));
      if (allIn) ins.eventIndexes.forEach((i) => next.delete(i));
      else ins.eventIndexes.forEach((i) => next.add(i));
      return next;
    });
  }, []);

  const finished = events.length > 0 && played >= events.length;
  const latestBroken = history.find((r) => r.flow === "broken");
  const latestFixed = history.find((r) => r.flow === "fixed");

  return (
    <div className="shell">
      <header className="topbar">
        <div>
          <h1>The Button That Lied</h1>
          <p className="topbar__sub">
            A scripted session takes on a checkout with three traps. Watch it fail, read the evidence, flip the fix, rerun.
          </p>
        </div>
        <div className="topbar__right">
          <span className="demo-badge">SYNTHETIC DEMO DATA</span>
          <div className="seg">
            <button className={`seg-btn ${flow === "broken" ? "seg-btn--on" : ""}`} onClick={() => start("broken")} disabled={playing}>
              Broken flow
            </button>
            <button className={`seg-btn seg-btn--fixed ${flow === "fixed" ? "seg-btn--on" : ""}`} onClick={() => start("fixed")} disabled={playing}>
              Fixed flow
            </button>
          </div>
          {playing ? (
            <button className="btn btn--ghost" onClick={skip}>Skip to evidence</button>
          ) : (
            <button className="btn" onClick={() => start(flow)}>{events.length === 0 ? "Run the session" : "Replay"}</button>
          )}
        </div>
      </header>

      <main className="workspace">
        <section className="stage-panel">
          <div className="stage-head">
            <span className="stage-title">Simulated checkout - scripted session replay</span>
            <span className="persona-chip">Persona: Sam - wants size M - has an expired code WELCOME10</span>
          </div>
          <div className="stage" ref={stageRef}>
            <CheckoutMock key={runKey} s={checkout} />
            <CursorLayer x={cursor.x} y={cursor.y} visible={cursor.visible && playing} rippleKey={ripple} />
            {events.length === 0 && (
              <div className="stage-intro">
                <p>Press <strong>Run the session</strong>. Predict where it breaks.</p>
              </div>
            )}
          </div>
          {finished && (
            <div className={`verdict ${checkout.outcome === "completed" ? "verdict--ok" : "verdict--bad"}`}>
              {checkout.outcome === "completed" ? "Completed" : "Abandoned"} - {checkout.outcomeReason}
            </div>
          )}
          {(latestBroken || latestFixed) && (
            <div className="compare">
              {latestBroken && (
                <div className="compare-card compare-card--bad">
                  <span className="compare-flow">Broken flow</span>
                  <span className="compare-out">{latestBroken.outcome}</span>
                  <span className="compare-meta">{latestBroken.failed_clicks} dead clicks - {latestBroken.refills} forced refills</span>
                </div>
              )}
              {latestFixed && (
                <div className="compare-card compare-card--ok">
                  <span className="compare-flow">Fixed flow</span>
                  <span className="compare-out">{latestFixed.outcome}</span>
                  <span className="compare-meta">{latestFixed.failed_clicks} dead clicks - {latestFixed.refills} refills</span>
                </div>
              )}
              <span className="compare-note">Same script, same persona. Runs persist in Postgres.</span>
            </div>
          )}
        </section>

        <EvidencePanel
          events={events}
          played={played}
          finished={finished}
          insights={insights}
          highlight={highlight}
          onInsight={toggleInsight}
        />
      </main>

      <footer className="foot">
        <p>Fictional store, fictional persona, scripted session. No real visitors were tracked, recorded or analyzed. The friction patterns are deterministic rules over a recorded timeline - the same shape of evidence a session-analytics product surfaces from real traffic.</p>
      </footer>
    </div>
  );
}
