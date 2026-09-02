<div align="center">

# Consensus

### A browser-native decision workspace where your ChatGPT agent helps you evaluate confidential vendors against weighted criteria — without ever uploading your documents.

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.3.4-black)](https://nextjs.org/)
[![WebMCP](https://img.shields.io/badge/WebMCP-Enabled-emerald)](https://github.com/web-mcp)
[![Tests Passing](https://img.shields.io/badge/Tests-77%20Passing-brightgreen)](evals/)

[**Live Demo (Production)**](https://consensus-henna.vercel.app/d/demo) · [**Architecture Guide**](docs/ARCHITECTURE.md) · [**Security Model**](docs/SECURITY.md) · [**Why WebMCP?**](docs/WHY-WEBMCP.md)

</div>

---

## The Problem

Evaluating high-stakes vendor contracts (SOC 2 reports, DPAs, enterprise pricing sheets) usually forces an impossible choice:
1. **Upload confidential agreements to a third-party server or cloud LLM backend**, violating confidentiality terms and corporate data residency policies.
2. **Read hundreds of pages manually**, risking missed exceptions, buried overage multipliers, and confirmation bias.

Server-side MCP (Model Context Protocol) does not solve this: connecting a server MCP tool to a confidential folder means reading and streaming that plaintext over the network to the model provider.

## The Solution: Browser-Native Selective Disclosure

**Consensus** introduces a **two-tier cryptographic trust boundary** built directly on top of the browser's `document.modelContext` (WebMCP) API:

1. **Find Without Reading (Search)**: PDFs are ingested and indexed entirely in the browser using client-side `pdf.js` and a local in-memory BM25 index (`minisearch`). The agent can search the corpus via `locate_evidence`, returning **only metadata** (document name, page number, relevance, match density) with **zero source text**.
2. **Explicit Human-in-the-Loop Release**: When the agent identifies a relevant page, it must request permission via `request_disclosure`. A non-blocking approval card appears in the UI. Plaintext is only provided through `read_snippet` **after the human clicks "Approve"**.
3. **Verified Inconsistency Flagging**: The agent can audit human scores, point out contradictions (such as claimed EU data residency when the DPA explicitly states US-only storage), and attach citations — but it **can never overwrite human scores**.

```
┌────────────────────────────────────────────────────────────────────────┐
│ BROWSER TAB (Your Device)                                              │
│                                                                        │
│   Confidential PDFs ──► pdf.js (Client) ──► BM25 Index (Memory)       │
│                                                   │                    │
│                                                   ▼                    │
│                                          locate_evidence (0 text)      │
│                                                   │                    │
│   Human Click ──► approveRequest() ──► read_snippet (Capped & Hashed) │
└───────────────────────────────────────────────────┬────────────────────┘
                                                    │
                                   WebMCP Protocol  │ (Only Released Pages)
                                                    ▼
                                          ┌───────────────────┐
                                          │ ChatGPT Agent     │
                                          │ (GPT-5.6 Terra)   │
                                          └───────────────────┘
```

---

## The 10 WebMCP Tools

Consensus exposes a comprehensive 10-tool surface dynamically gated on workspace capabilities:

| # | Tool Name | Kind | Requires | Description |
|---|---|:---:|:---:|---|
| 1 | `get_decision_state` | Read | `[]` | Reads current matrix options, criteria, weights, scores, and unevidenced gaps. |
| 2 | `list_documents` | Read | `[]` | Lists loaded confidential documents, page counts, option scopes, and status. |
| 3 | `explain_ranking` | Read | `['matrix']` | Computes weighted arithmetic and calculates the minimum single weight change that inverts the top two options (`flipAnalysis`). |
| 4 | `locate_evidence` | Read | `['documents']` | Fast BM25 lexical search. **Returns zero text** — only document ID, page, relevance, and match count. |
| 5 | `request_disclosure` | Write | `['documents']` | Non-blocking request for human permission to read a specific page with a stated reason. |
| 6 | `read_snippet` | Read (Gated) | `['documents']` | Reads released plaintext (capped at 1,200 chars, delimited as data) after human release. |
| 7 | `propose_criterion` | Write | `['matrix']` | Proposes a new evaluation criterion with a suggested weight for human approval. |
| 8 | `propose_score` | Write | `['matrix']` | Suggests a score (1–5) with rationale and verified citations. |
| 9 | `attach_evidence` | Write | `['matrix', 'documents']` | Links an approved page citation to a matrix cell (fails closed if unreleased). |
| 10 | `flag_inconsistency` | Write | `['matrix', 'documents']` | Challenges a human-entered score when evidence contradicts it. Highlights cell in red and mounts an anchored challenge card. |

> [!IMPORTANT]
> **Absent by Design:** Consensus deliberately has **no** `set_score`, `set_weight`, `delete_option`, or `override_human` tools. The agent can only propose and challenge; the human retains complete authority over the decision.

---

## Security & Architectural Guarantees

- **`connect-src 'self'` CSP**: Structurally blocks the browser from transmitting any document bytes to external origins. No third-party analytics, no tracking, and no external CDNs.
- **Fail-Closed Metadata Projection**: `project.ts` explicitly constructs search results field-by-field without spreading raw objects, guaranteeing zero accidental text leakage.
- **Single Release Call Site**: `approveRequest` is called from exactly **one** place in application code: the human UI click handler in `lib/gate/humanRelease.ts`.
- **Session-Scoped Ephemeral Seals**: Releasing a page applies only to the current in-memory session. Refreshing the browser instantly reseals every document.

---

## Test Suites & Verification

Consensus includes 77 automated unit and boundary tests:

```bash
# Run all Vitest suites
npm test
```

```
 ✓ evals/boundary.spec.ts (17 tests)
 ✓ evals/descriptions.spec.ts (34 tests)
 ✓ evals/gate.spec.ts (12 tests)
 ✓ evals/security.spec.ts (14 tests)

Test Files  4 passed (4)
     Tests  77 passed (77)
```

- **`security.spec.ts`**: 20 queries × 5,304 shingles proving zero source text leakage in search.
- **`descriptions.spec.ts`**: Asserts all 10 tools stay strictly within Chrome WebMCP character budgets.
- **`gate.spec.ts`**: Tests the 6-state permission transition machine and ledger immutability.
- **`boundary.spec.ts`**: Validates capability requirements and citation boundaries.

---

## Quickstart (Local Development)

```bash
# 1. Clone the repository
git clone https://github.com/edish-github/Consensus.git
cd Consensus

# 2. Install dependencies (auto-copies pdf.js worker to public/)
npm install

# 3. Start development server
npm run dev

# 4. Open in Chrome (with chrome://flags/#enable-webmcp-testing) or ChatGPT desktop app:
# http://localhost:3000/d/demo
```

---

## License

This project is open source and available under the [MIT License](LICENSE).
