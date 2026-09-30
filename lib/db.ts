import type { Flow, Run, SessionEvent } from "./types";

/**
 * Postgres access layer (same pattern as the sibling demo):
 * - DATABASE_URL set (Vercel Postgres / Neon) -> queries via `pg`.
 * - otherwise -> embedded Postgres (PGlite, PostgreSQL compiled to WASM).
 */

interface QueryResult<T> { rows: T[] }
interface Adapter { query<T>(text: string, params?: unknown[]): Promise<QueryResult<T>> }

async function createAdapter(): Promise<Adapter> {
  if (process.env.DATABASE_URL) {
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    return {
      query: async <T>(text: string, params?: unknown[]) => {
        const res = await pool.query(text, params as never[]);
        return { rows: res.rows as T[] };
      },
    };
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const pglite = new PGlite();
  return {
    query: async <T>(text: string, params?: unknown[]) => {
      const res = await pglite.query(text, params as never[]);
      return { rows: res.rows as T[] };
    },
  };
}

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS runs (
    id BIGSERIAL PRIMARY KEY,
    flow TEXT NOT NULL,
    outcome TEXT NOT NULL,
    failed_clicks INT NOT NULL,
    refills INT NOT NULL,
    duration_ms INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS events (
    id BIGSERIAL PRIMARY KEY,
    run_id BIGINT NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
    seq INT NOT NULL,
    t INT NOT NULL,
    kind TEXT NOT NULL,
    target TEXT,
    payload JSONB
  )`,
  `CREATE TABLE IF NOT EXISTS insights (
    id BIGSERIAL PRIMARY KEY,
    run_id BIGINT NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
    pattern TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    event_indexes INT[] NOT NULL
  )`,
];

declare global {
  // eslint-disable-next-line no-var
  var __buttonLiedDb: Promise<Adapter> | undefined;
}

function getAdapter(): Promise<Adapter> {
  if (!globalThis.__buttonLiedDb) {
    globalThis.__buttonLiedDb = (async () => {
      const adapter = await createAdapter();
      for (const stmt of SCHEMA_STATEMENTS) await adapter.query(stmt);
      return adapter;
    })();
  }
  return globalThis.__buttonLiedDb;
}

export async function insertRun(flow: Flow, outcome: string, failedClicks: number, refills: number, durationMs: number): Promise<number> {
  const db = await getAdapter();
  const { rows } = await db.query<{ id: number }>(
    `INSERT INTO runs (flow, outcome, failed_clicks, refills, duration_ms) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
    [flow, outcome, failedClicks, refills, durationMs]
  );
  return rows[0].id;
}

export async function insertEvents(runId: number, events: SessionEvent[]) {
  const db = await getAdapter();
  for (const [seq, e] of events.entries()) {
    await db.query(
      `INSERT INTO events (run_id, seq, t, kind, target, payload) VALUES ($1,$2,$3,$4,$5,$6)`,
      [runId, seq, e.t, e.kind, e.target ?? null, e.payload ? JSON.stringify(e.payload) : null]
    );
  }
}

export async function insertInsights(runId: number, insights: { pattern: string; title: string; summary: string; eventIndexes: number[] }[]) {
  const db = await getAdapter();
  for (const ins of insights) {
    await db.query(
      `INSERT INTO insights (run_id, pattern, title, summary, event_indexes) VALUES ($1,$2,$3,$4,$5)`,
      [runId, ins.pattern, ins.title, ins.summary, ins.eventIndexes]
    );
  }
}

export async function recentRuns(limit = 12): Promise<Run[]> {
  const db = await getAdapter();
  const { rows } = await db.query<Run>(
    `SELECT id, flow, outcome, failed_clicks, refills, duration_ms, created_at FROM runs ORDER BY id DESC LIMIT $1`,
    [limit]
  );
  return rows;
}
