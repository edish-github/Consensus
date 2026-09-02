# Architectural Decisions

Short records of the non-obvious calls. Each entry is two minutes to write and
prevents relitigating a settled question at hour 60.

---

## 2026-09-02 — Capability gating replaces linear phases

**Context.** Tool registration was gated on a linear phase 0→3. It could not
express "matrix but no documents" or the reverse — every branch required
documents, so a fully populated matrix sat at phase 0 with one tool registered.

**Chosen.** Tools declare `requires: (keyof Capabilities)[]`; the registry
filters on satisfied capabilities.

**Reason.** Each tool is gated on what it actually needs. Also a better claim
for the README than an arbitrary sequence.

**Reversible?** Yes, but no reason to.

---

## 2026-09-02 — PDF extraction uses pdf.js's own worker

**Context.** The design called for a Web Worker we wrote. pdf.js already parses
in its own dedicated worker; wrapping that in an outer worker would nest
workers for no measured performance gain while adding a failure mode.

**Chosen.** pdf.js parses off the main thread in its own worker. Text assembly,
normalisation and 600-character chunking stay on the main thread, with
`await yieldToMain()` between pages.

**Reason.** 89 pages ingest with no visible jank. The honest answer beats a
worker we did not need. `ARCHITECTURE.md §10` states the divergence explicitly.

**Reversible?** Yes. If profiling ever shows main-thread contention, the
chunking step can move to a worker without touching the pipeline's shape.

---

## 2026-09-02 — `hint` is not scrubbed; `message` is

**Context.** `envelope.err()` truncated any string over 80 characters, to stop a
caught exception carrying document text into an error message. It was also
truncating `HINTS.WAIT_FOR_USER` at 80 of its 123 characters, cutting off
**"Do not guess the contents."**

**Chosen.** Scrub `message`. Leave `hint` untouched.

**Reason.** Hints are developer-authored constants containing zero user data,
and they are the behavioural steering that makes the agent wait rather than
fabricate. The rule: scrub anything that could carry document text; never scrub
anything we wrote ourselves.

**Reversible?** No. Reverting would silently degrade agent behaviour again.

---

## 2026-09-02 — One human release path, not two

**Context.** Two pieces of UI need to release a page: the approval queue and the
challenge card's inline control. Calling `approveRequest` from both would create
two places the invariant could drift.

**Chosen.** `lib/gate/humanRelease.ts` is the single human-authored path. Both
components call it; it is called only from `onClick` handlers.

**Reason.** Keeps the audit trivial — `grep approveRequest` returns two hits in
application code, the slice and that module.

**Reversible?** No. The single call site is the security claim.

---

## 2026-09-02 — BM25, not embeddings

**Context.** A semantic index would retrieve marginally better than lexical
search over the corpus.

**Chosen.** MiniSearch (BM25). No embeddings, no model download.

**Reason.** transformers.js is a ~25MB download that can stall during a recorded
demo. Over five documents, lexical search is sufficient and always loads. This
is a deliberate constraint, not a shortcut, and it is stated as one.

**Reversible?** Yes, but the demo-day risk does not change.

---

## 2026-09-02 — The approval queue is sticky and self-scrolling

**Context.** The queue rendered above the matrix and was correct but invisible.
During testing an agent requested a page, the card appeared below the fold, and
the session stalled with nobody aware anything was waiting.

**Chosen.** `sticky top-4 z-10`, plus `scrollIntoView` when the pending count
rises.

**Reason.** A permission request nobody sees is a permission request that
silently fails. On camera it would have looked like a broken gate.

**Reversible?** Yes, but do not.
