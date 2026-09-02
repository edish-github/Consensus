# Consensus — Architectural Decisions

## 2026-09-02 — capability gating replaces linear phases
Linear phases couldn't express "matrix but no documents" or the reverse —
every branch required documents, so a full matrix sat at phase 0.
Chosen: tools declare `requires: (keyof Capabilities)[]`, registry filters
on satisfied capabilities.
Reason: each tool is gated on what it actually needs. Also a better claim
for the README than an arbitrary sequence.
Reversible? Yes, but no reason to.

## 2026-09-02 — PDF extraction threading: leverage pdf.js internal worker
lib/ingest/extract.ts does not spawn a custom web worker because pdf.js
already parses in its own dedicated worker. Wrapping that in an outer worker
would nest workers for no measured performance gain while adding failure modes.
Text assembly, normalisation, and 600-character chunking stay on the main
thread, yielding to the event loop between pages.
Note: ARCHITECTURE.md §10 and diagram 08 will be updated in the docs pass.

