"use client";

import type { Insight, SessionEvent } from "@/lib/types";
import { describe, fmtT } from "@/lib/describe";

const TEASERS = ["A button that ignores you", "A form that forgets", "A price that changes its mind"];

export default function EvidencePanel({
  events,
  played,
  finished,
  insights,
  highlight,
  onInsight,
}: {
  events: SessionEvent[];
  played: number;
  finished: boolean;
  insights: Insight[];
  highlight: Set<number>;
  onInsight: (ins: Insight) => void;
}) {
  return (
    <div className="evidence">
      <section className="insights">
        <h4 className="panel-title">Friction patterns - rule-derived, not vibes</h4>
        {!finished &&
          TEASERS.map((t, i) => (
            <div key={t} className="insight insight--locked">
              <span className="insight-num">{i + 1}</span>
              <div>
                <p className="insight-title">{t}</p>
                <p className="insight-sum">Watch the session. The evidence will name this one.</p>
              </div>
            </div>
          ))}
        {finished && insights.length === 0 && (
          <div className="insight insight--clean">
            <span className="insight-num insight-num--clean">0</span>
            <div>
              <p className="insight-title">No friction patterns detected</p>
              <p className="insight-sum">Same script, same persona - not one dead click, refill or abandonment trigger. The rules that caught three patterns in the broken flow find nothing here. That is the point.</p>
            </div>
          </div>
        )}
        {finished &&
          insights.map((ins) => (
            <button key={ins.pattern} className="insight" onClick={() => onInsight(ins)}>
              <span className="insight-num insight-num--found">{ins.eventIndexes.length}</span>
              <div>
                <p className="insight-title">{ins.title}</p>
                <p className="insight-sum">{ins.summary}</p>
                <span className="insight-cta">highlight the evidence</span>
              </div>
            </button>
          ))}
      </section>

      <section className="feed">
        <h4 className="panel-title">Session timeline{events.length > 0 ? ` - ${Math.min(played, events.length)} of ${events.length} events` : ""}</h4>
        {events.length === 0 && <p className="muted">Run a session and every move, click and silent failure lands here with a timestamp.</p>}
        <ol className="feed-list">
          {events.slice(0, played).map((e, i) => {
            const d = describe(e);
            return (
              <li key={i} className={`feed-row ${d.bad ? "feed-row--bad" : ""} ${highlight.has(i) ? "feed-row--hl" : ""} ${i === played - 1 ? "feed-row--now" : ""}`}>
                <span className="feed-t">{fmtT(e.t)}</span>
                <span className="feed-icon">{d.icon}</span>
                <span className="feed-text">{d.text}</span>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
