# Architecture

**Consensus** — the system as built.

This document describes the shipped implementation, including two places where
it deliberately diverges from the original design. Both divergences are marked
and explained; a document that quietly matched the code would be less useful
than one that says where the plan changed and why.

---

## Contents

1. [Constraints](#1-constraints)
2. [System overview](#2-system-overview)
3. [Stack](#3-stack)
4. [Directory](#4-directory)
5. [Data model](#5-data-model)
6. [State](#6-state)
7. [The WebMCP layer](#7-the-webmcp-layer)
8. [Tool catalogue](#8-tool-catalogue)
9. [The disclosure gate](#9-the-disclosure-gate)
10. [Ingestion](#10-ingestion)
11. [Search](#11-search)
12. [Scoring](#12-scoring)
13. [Error contract](#13-error-contract)
14. [Evals](#14-evals)
15. [Deployment](#15-deployment)
16. [Failure modes](#16-failure-modes)

---

## 1 · Constraints

Every one of these comes from the judging environment and shaped the design.

| # | Constraint | Consequence |
|---|---|---|
| C1 | ChatGPT's built-in browser does not discover tools registered inside iframes | The workspace renders in the top-level document. No iframe in the critical path. |
| C2 | The declarative HTML form API is unavailable in ChatGPT | Imperative `registerTool()` only |
| C3 | `navigator.modelContext` deprecated in Chrome 150 | Bind to `document.modelContext`, feature-detect, no shim |
| C4 | Tools are per-document and ephemeral | Single-page workspace; registration tied to component lifecycle |
| C5 | Secure context required; `tools` Permissions-Policy defaults to `self` | HTTPS only, no cross-origin exposure |
| C6 | Chrome budgets: 500 chars per tool description, 150 per param, 30 per name | Descriptions written to budget, enforced by `descriptions.spec.ts` |
| C7 | Overlapping descriptions degrade tool selection | Disjoint verbs, overlap lint at Jaccard 0.34 |
| C8 | Tool definitions and outputs are untrusted content to the agent | `untrustedContentHint` on `read_snippet`; released text delimited and capped |
| C9 | No shipped progress primitive for long-running tools | Every tool returns in <200ms; long work happens in ingestion and is reported through page state |
| C10 | React StrictMode double-invokes effects | Registry is refcounted and idempotent |

---

## 2 · System overview

![System architecture](diagrams/01-system-architecture.svg)

Everything runs in the browser. No application server, no database, no
authentication, no upload endpoint.

**One trust path.** Confidential files enter through the File API, are parsed by
pdf.js, and are indexed in memory. Everything the agent ever sees passes through
the gate: either the metadata projection, which strips every character, or
`read_snippet` after a human release.

---

## 3 · Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15, App Router | Zero-config HTTPS on Vercel; fast to ship |
| Language | TypeScript, `strict` + `noUncheckedIndexedAccess` | The whole project is a type-enforced boundary |
| State | Zustand + immer | ★ See §6 — tool `execute()` runs outside React |
| PDF | pdf.js (`pdfjs-dist` v6) | Battle-tested, parses in its own worker |
| Search | MiniSearch | ~10KB, BM25, synchronous, `storeFields` control |
| Animation | Motion | `layout` prop gives correct FLIP reordering |
| Validation | Zod | Runtime mirror of the JSON Schemas sent to the agent |
| Testing | Vitest | Fast, TS-native, runs `execute()` directly |
| Hosting | Vercel | Sponsor platform; no server-side logic to move |

**No embeddings, by design.** A semantic index would retrieve marginally better
and requires a ~25MB model download that can stall on demo day. Over a corpus of
five documents, BM25 is sufficient and always loads. This is a deliberate
constraint, not a shortcut.

---

## 4 · Directory

```
consensus/
├── app/
│   ├── page.tsx                        Landing
│   └── d/[decisionId]/page.tsx         ★ THE WORKSPACE. Top-level, never framed.
│
├── components/
│   ├── matrix/                         The co-authored artifact
│   │   ├── DecisionMatrix.tsx          Grid, keyboard nav
│   │   ├── MatrixCell.tsx              1–5 entry, provenance chip, challenge ring
│   │   ├── WeightSlider.tsx            Human-only control
│   │   └── RankingBoard.tsx            ★ Animated leaderboard
│   ├── evidence/                       Dropzone, document cards, vault
│   ├── gate/                           ★ The security kernel's UI
│   │   ├── DisclosureQueue.tsx         Sticky, self-scrolling
│   │   ├── DisclosureRequestCard.tsx   ★ Release lives here
│   │   └── DisclosureLedger.tsx        Append-only record
│   ├── proposals/
│   │   └── ChallengeCard.tsx           ★ The 1:30 demo moment
│   ├── agent/                          Provider, tool panel, activity log
│   └── export/                         Decision brief
│
├── lib/
│   ├── webmcp/                         ★ The layer judges read first
│   │   ├── client.ts                   Feature detection, drift tolerance
│   │   ├── registry.ts                 ★ Epoch controller, capability diff
│   │   ├── envelope.ts                 ok() / err(), the scrub rule
│   │   ├── descriptions.ts             All descriptions, budget-linted
│   │   └── tools/                      10 tools
│   ├── gate/humanRelease.ts            ★ The single human-authored release path
│   ├── vault/readPage.ts               ★ Plaintext call site 2 of 2
│   ├── search/
│   │   ├── index.ts                    ★ storeFields excludes text
│   │   └── project.ts                  ★ Fail-closed projection
│   ├── ingest/                         Worker client, normalise, chunk
│   ├── scoring/                        rank, gaps, explain
│   ├── store/                          5 slices + memoised selectors
│   └── persistence/exportBrief.ts      The decision artifact
│
├── evals/                              77 assertions + manual protocol
├── docs/                               This, SECURITY, WHY-WEBMCP, TOOLS
└── public/sample/                      5 synthetic PDFs, 89 pages
```

### Files carrying disproportionate weight

| File | Why |
|---|---|
| `lib/search/project.ts` | The security guarantee is enforced here |
| `lib/gate/humanRelease.ts` | The single path to `released` |
| `lib/webmcp/registry.ts` | Where most entrants get ghost tools |
| `lib/webmcp/tools/locateEvidence.ts` | The novel primitive |
| `components/matrix/RankingBoard.tsx` | On camera at the climax |

---

## 5 · Data model

```ts
type Rating = 1 | 2 | 3 | 4 | 5;   // scores and weights, narrowed at the type level
```

**The property that matters:** `PageChunk.text` is the only field holding
confidential plaintext, and it is referenced by exactly two modules — the search
indexer and `readPage.ts`. Keeping that surface this narrow is what makes the
security test tractable.

![Data model](diagrams/13-data-model-er.svg)

Key shapes:

| Type | Note |
|---|---|
| `Option` | `createdBy: 'human'` — no tool creates one |
| `Criterion` | `weight` is human-only; no tool writes it |
| `Score` | Carries `source` and `evidenceRefs`. An empty `evidenceRefs` renders "no source". |
| `PageChunk` | ⚠ plaintext. Page = the disclosure unit. |
| `SubChunk` | ⚠ plaintext. ~600 chars, 80 overlap. Retrieval unit. |
| `DisclosureRequest` | Five seal states, `reRequestCount` capped at 1 |
| `LedgerEntry` | Written for approvals **and** denials |
| `Challenge` | `evidenceRefs` (read) and `unreadRefs` (located, not read) held separately |

---

## 6 · State

![Scoring engine](diagrams/10-scoring-engine.svg)

Five slices composed into one Zustand store.

### ★ Why Zustand, and why at module scope

A tool's `execute()` runs from the WebMCP host, not from a React render. It
cannot use hooks. Every tool therefore imports the store directly:

```ts
import { store } from '@/lib/store';
const state = store.getState();
```

React Context cannot do this. That single constraint determined the state
library, and the consequence is the thing the product claims: **the state the
agent's tools mutate is literally the same object the UI renders.**

### ⚠ Every selector returning an object must be memoised

Zustand v5 uses `useSyncExternalStore` strictly. A selector building a fresh
array on each call makes `Object.is(prev, next)` always false, React concludes
the store changed on every render, and the app spins.

`selectRanking`, `selectGaps`, `selectFlip` and `selectCapabilities` cache
against the referentially stable `[options, criteria, scores]` slices — immer
swaps those precisely when the data changes, so the cache invalidates exactly
when it should.

This cost us an infinite render loop before it was understood. Noted here so it
does not cost anyone else one.

---

## 7 · The WebMCP layer

### ⚠ Divergence 1 — capabilities replaced linear phases

The original design gated registration on a linear phase 0→3. It could not
express the real states: a workspace can have a matrix and no documents
(`explain_ranking` applies, `locate_evidence` does not) or documents and no
matrix. Every branch required documents, so a fully populated matrix sat at
phase 0 with one tool registered.

Tools now declare `requires: (keyof Capabilities)[]`, and the registry filters
on satisfied capabilities. Each tool is gated on what it actually needs, which
is both correct and a better claim than an arbitrary sequence.

![Capability gating](diagrams/07-capability-gated-registration.svg)

### The epoch controller

Three problems, all of which produce demo-day failures if solved naively:

1. **Ghost tools** — a tool registered against a view that no longer exists. Solved by diffing the desired set against the registered set on every change, *including downward*, which is the half most implementations skip.
2. **Double registration** — StrictMode invokes effects twice. Solved by keying on tool name and making `syncRegistration` idempotent.
3. **Teardown during execution** — a capability change can unregister a tool mid-execute. Each registration owns an `AbortController`; the signal reaches `execute`.

Teardown is a separate effect with `[]` deps. In the same effect as
registration, every capability flip would unregister everything and immediately
re-register it, churning the agent's tool list on every score entry.

---

## 8 · Tool catalogue

![Tool surface](diagrams/06-tool-surface-map.svg)

Ten tools. Full schemas in [`TOOLS.md`](TOOLS.md), which is generated from the
code and cannot drift.

**Design note that matters for testability:** a tool's `execute` returns the
domain envelope (`ToolResult`), not the WebMCP content-block shape. The
registry's `wrapExecute` does that translation. This means evals call
`execute()` directly and assert on a plain object — no browser, no agent, no
serialisation in the way.

`wrapExecute` also guarantees **the tool never rejects.** A thrown exception
becomes a structured `INTERNAL` envelope. An agent receiving a rejected promise
sees an opaque transport failure and typically retries blindly or invents a
result; one receiving `{ok:false, code, hint}` self-corrects.

---

## 9 · The disclosure gate

![Disclosure gate](diagrams/03-disclosure-gate-state-machine.svg)

See [`SECURITY.md §5`](SECURITY.md#5--the-human-in-the-loop-gate) for the full
model. Architecturally:

- `createRequest` is callable from a tool; it grants nothing
- `approveRequest` is the only transition to `released`, reachable from exactly one module (`lib/gate/humanRelease.ts`), called only from `onClick`
- Every decision writes a `LedgerEntry`, denials included
- `released` never survives a reload

---

## 10 · Ingestion

![Ingestion](diagrams/08-ingestion-pipeline.svg)

### ⚠ Divergence 2 — the threading model

The original design called for a Web Worker we wrote. In practice pdf.js
**already** parses in its own worker — parsing, font handling, content-stream
decoding all run off the main thread. Wrapping that in a second worker means
nesting workers, which is supported in Chromium but is an extra failure mode
for no measured gain.

What remains on the main thread is text assembly, normalisation and chunking —
a few milliseconds per page — and we `await yieldToMain()` between pages so the
browser can paint. The 89-page corpus ingests with no visible jank.

The honest answer beats a worker we did not need.

### Two chunk granularities, deliberately

**Page chunks are the unit of disclosure.** Permission is granted per page
because a page is a thing a human can reason about: "release page 13 of the
DPA" is a decision someone can make. "Release sub-chunk c_91" is not.

**Sub-chunks (~600 chars, 80 overlap) are the unit of retrieval.** BM25
precision over small windows is far better, and the match count per page becomes
a real density signal. The overlap matters: without it, a phrase straddling a
boundary is invisible to search — and "EU subprocessor arrangement" is the demo.

Normalisation repairs hyphenation across line breaks, ligatures and curly
quotes. A query for "subprocessor" must match a page that rendered it as
`sub-\nprocessor`, or the central query returns nothing.

---

## 11 · Search

![Metadata projection](diagrams/09-metadata-projection.svg)

Two independent barriers, detailed in
[`SECURITY.md §4`](SECURITY.md#4--fail-closed-projection):

1. `storeFields` excludes `text` — no field exists on a hit to leak
2. `projectToMetadata` constructs its output field by field, never spreads

Sub-chunk hits collapse to page granularity, because the page is what the human
will be asked to release. `matchCount` is the number of distinct sub-chunks that
matched — a genuine signal about where relevant content is dense, revealing none
of it.

**Verified against the real corpus:** 89 pages, 156 sub-chunks. The query "SOC 2
availability exception" returns `vendor-b-soc2.pdf` p.14 with the highest match
count in the set. "EU subprocessor data residency pending" returns
`vendor-a-dpa.pdf` p.13 at relevance 1.0.

---

## 12 · Scoring

```
weightedTotal = Σ score(o,c) × weight(c)   over SCORED cells only
maxPossible   = Σ 5 × weight(c)            over the same cells
normalised    = weightedTotal / maxPossible
```

Unscored cells are excluded from **both** sides. Without that, an option nobody
has evaluated yet ranks last for being unevaluated — wrong, and actively
misleading during a partial evaluation.

The trade-off is that a 50%-scored option can lead, which is why every row shows
its completeness percentage: a provisional leader is visibly provisional.

`flipAnalysis` computes the smallest single weight change that inverts the top
two. It is the one derived value that lets `explain_ranking` say something about
robustness rather than restating arithmetic.

Ties break by completeness, then alphabetically — deterministic, so the layout
animation never jitters.

---

## 13 · Error contract

![Error contract](diagrams/18-error-contract.svg)

```ts
type ToolResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: ErrorCode; message: string; hint?: string; retryable: boolean };
```

Eight codes, each with an actionable hint. `PERMISSION_DENIED` carries *"Do not
request this page again. Say what you could not verify and continue."*

### ⚠ The scrub rule

`err()` truncates any `message` over 80 characters, because a caught exception
can carry document text.

It deliberately does **not** scrub `hint`. Hints are developer-authored
constants containing zero user data — and the scrub was silently cutting
`HINTS.WAIT_FOR_USER` at 80 of its 123 characters, removing **"Do not guess the
contents."** Every `PERMISSION_REQUIRED` the agent received was the setup
without the instruction.

Found by a test asserting on exact strings. The rule: **scrub anything that
could carry document text; never scrub anything we wrote ourselves.**

---

## 14 · Evals

![Eval harness](diagrams/19-eval-harness.svg)

77 automated assertions across four suites, plus a 13-prompt manual protocol.
Full results and findings in [`../evals/RESULTS.md`](../evals/RESULTS.md).

The security suite has been verified by breaking it — three tests fail
simultaneously when a preview field is added to the projection.

---

## 15 · Deployment

![Deployment](diagrams/14-deployment-architecture.svg)

Vercel. Static plus client bundle, HTTPS automatic. No server-side logic, so
migration to Cloudflare Workers or Netlify is a config change.

Requirements: HTTPS (C5), workspace at a top-level route never framed (C1),
`pdf.worker.min.mjs` served same-origin from `public/` so the CSP can keep
`worker-src 'self'`.

Full header policy in [`SECURITY.md §3`](SECURITY.md#3--zero-egress--the-csp).

---

## 16 · Failure modes

| # | Failure | Mitigation |
|---|---|---|
| F1 | Ghost tools | Capability-derived registration, diffed both directions |
| F2 | Double registration | Idempotent registry keyed by tool name |
| F3 | Tools registered before DOM ready | Registration lives in a mount effect only |
| F4 | Agent picks the wrong tool | Disjoint verbs, description-overlap lint |
| F5 | Agent invents document content | The `note` field in results, explicit hints, prompt 3 of the manual protocol |
| F6 | Silent execute failure | `wrapExecute` try/catch returning `INTERNAL` with a hint |
| F7 | Stale state | All tools read fresh from `getState()` at call time |
| F8 | Infinite render loop | Memoised selectors — see §6 |
| F9 | Animation remounts instead of reordering | Stable nanoid keys, immer-preserved identities |
| F10 | Scanned PDF with no text layer | Detected, flagged `no-text`, reported by `list_documents` |
| F11 | Snippet exceeds output budget | Hard 1200-char cap with `truncated: true` |
| F12 | Spec drift breaks registration | Feature detection; tested versions in the README |
| F13 | Approval card off-screen | Queue is sticky and scrolls itself into view — found during testing, when a request appeared below the fold and the session stalled silently |

---

## Related

- [`WHY-WEBMCP.md`](WHY-WEBMCP.md) — why the browser, in full
- [`SECURITY.md`](SECURITY.md) — the complete security model
- [`TOOLS.md`](TOOLS.md) — generated tool reference
- [`../evals/RESULTS.md`](../evals/RESULTS.md) — every run and every finding
- [`diagrams/`](diagrams/) — all 22 diagrams, sources in `diagrams/src/`
