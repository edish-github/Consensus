# Consensus — Architectural Decisions

## 2026-09-02 — capability gating replaces linear phases
Linear phases couldn't express "matrix but no documents" or the reverse —
every branch required documents, so a full matrix sat at phase 0.
Chosen: tools declare `requires: (keyof Capabilities)[]`, registry filters
on satisfied capabilities.
Reason: each tool is gated on what it actually needs. Also a better claim
for the README than an arbitrary sequence.
Reversible? Yes, but no reason to.
