# The Button That Lied

A tiny checkout with **three UX traps**, a scripted session that walks into all of them,
and the evidence that explains the failure - then one switch fixes the flow and the same
script reruns clean. Built as a demonstration of evidence-first session analysis: not
"users dropped off", but *this control, these clicks, this wipe, this late fee*.

**Everything is synthetic.** Fictional store, fictional persona, deterministic script.
No real visitors are tracked, recorded or analyzed.

## The three traps

1. **A button that ignores you** - "Place order" with no size selected does nothing. No error,
   no hint. The session clicks it twice. (Rule: repeated failed clicks on one control.)
2. **A form that forgets** - changing the shipping method re-renders the form and wipes three
   completed address fields. The session retypes all of them. (Rule: backtracking after data loss.)
3. **A price that changes its mind** - the $8 express fee appears one step before payment.
   The session survives traps 1 and 2, and abandons here. (Rule: abandonment after a late total change.)

The fixed flow answers each failure at the moment it happens: an inline size error, an honest
"expired code" message, preserved form state, and the fee shown before the pay step.
Same script, same persona - it completes.

## How it works

- **Deterministic scripted sessions** in `lib/scripts.ts` - one fictional persona
  (size M, expired code `WELCOME10`) runs both flows.
- **Rule-based insight derivation** in `lib/insights.ts` - consecutive no-op clicks,
  wipe-then-retype sequences, and abandonment after a late price change are grouped
  into friction patterns. No LLM, no claims about real conversion.
- **Postgres** stores every run, every timestamped event, and every derived insight
  (`runs`, `events`, `insights` tables) - so the evidence is queryable, not just rendered.
  - Zero-config: no `DATABASE_URL` needed - the app boots **PGlite** (PostgreSQL compiled
    to WebAssembly) in-process.
  - Set `DATABASE_URL` and the same queries run against your Postgres via `pg`.

## Stack

Next.js 15 (App Router) + TypeScript + Node route handlers + Postgres (PGlite or `pg`).
No tracking scripts anywhere - the "session replay" is a deterministic animation.

## Run it

```bash
npm install
npm run dev
# open http://localhost:3000
```

Deep links: `/?flow=broken&autorun=1`, `/?flow=fixed&autorun=1`

## Deploy

Import into Vercel - builds and runs as-is (embedded Postgres). For persistence, add any
Postgres and set `DATABASE_URL`.

---

Built by an AI agent directed by Sarthak Patel, as a demonstration of agent-orchestrated
engineering: scoped, built and verified end-to-end from a one-paragraph brief.
