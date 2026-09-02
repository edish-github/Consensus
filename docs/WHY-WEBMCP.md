# Why WebMCP? — Architectural Rationale

This document explains why **Consensus** is built specifically on **WebMCP** (`window.modelContext` / `document.modelContext`) and why traditional server-side MCP (Model Context Protocol) cannot deliver the same privacy, trust, or interactive guarantees.

---

## The Fundamental Dilemma of Server-Side MCP

Traditional Model Context Protocol servers run as separate backend processes (either locally over stdio or remotely over SSE/HTTP):

```
[ Local Confidential Documents ]
              │
              ▼ (Full Plaintext Streamed Over Wire)
[ Server-Side MCP Process ]
              │
              ▼ (Plaintext Transmitted to LLM Cloud)
[ Third-Party LLM Provider (e.g. OpenAI / Anthropic) ]
```

When an agent needs to evaluate documents via a Server MCP tool:
1. **The server must read the file into memory and return text to the LLM context.** There is no mechanism for an agent to "know where the answer is" without the server streaming that text into the model's token stream.
2. **Trust is all-or-nothing**: Either the server tool is authorized and reads everything, or the tool is blocked and the agent is blind.
3. **Data Egress is Inevitable**: Confidential enterprise contracts, pricing terms, and compliance audits leave the customer's device.

---

## The WebMCP Difference: In-Browser Execution & Selective Disclosure

WebMCP executes tool handlers **inside the browser execution context**:

```
┌────────────────────────────────────────────────────────────────────────┐
│ USER'S BROWSER TAB (Consensus WebMCP Host)                             │
│                                                                        │
│   Confidential PDFs ──► pdf.js (Client) ──► BM25 MiniSearch Index      │
│                                                   │                    │
│   Tool 1: locate_evidence() ◄─────────────────────┘                    │
│           └── Returns: { doc: "dpa.pdf", page: 13, relevance: 1.0 }   │
│               (ZERO TEXT LEAVES THE TAB)                               │
│                                                                        │
│   Tool 2: request_disclosure()                                         │
│           └── UI Mounts Interactive Approval Card (Human Clicks)       │
│                                                                        │
│   Tool 3: read_snippet()                                               │
│           └── Returns: "Released page 13 text..." (ONLY WITH APPROVAL) │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                       WebMCP Wire  │ (Only metadata & approved snippets)
                                    ▼
                          ┌───────────────────┐
                          │ ChatGPT Desktop   │
                          │ Browser Agent     │
                          └───────────────────┘
```

---

## Four Capabilities Unique to WebMCP

### 1. Inverted Search ("Find Without Reading")
Because the BM25 search index lives in the user's browser memory, `locate_evidence` runs entirely in the tab. It computes relevance scores across 80+ pages in ~2ms, returning page pointers to the agent **without exposing the text**.
*Under Server MCP, searching requires either returning matching chunks or running a full server-side RAG pipeline that pre-emptively ingests and stores the data.*

### 2. Zero-Latency Dynamic Registration & Capability Gating
Consensus dynamically adjusts its registered tool surface as the user interacts with the page:
- On a fresh workspace: 3 tools registered.
- When documents are dropped: `locate_evidence`, `request_disclosure`, and `read_snippet` register automatically.
- When scores are entered: `flag_inconsistency` registers.

Because WebMCP integrates directly with the page lifecycle, tool updates happen in real time via `document.modelContext.registerTool()` without restarting a server daemon.

### 3. Native Visual Co-Presence (The Human-in-the-Loop)
In WebMCP, the tool execution shares memory with the React DOM:
- When the agent calls `flag_inconsistency`, the tool handler updates the Zustand store in the same frame, instantly turning the matrix cell red with a warning ring and mounting an anchored Challenge Card.
- When the human clicks **"Release page 13"**, the state machine transitions immediately, allowing the agent's next `read_snippet` call to succeed.

There is no polling, no webhook relay, and no backend synchronization delay.

### 4. Verifiable Client-Side Containment
With `connect-src 'self'` enforced via Content Security Policy (CSP), the browser guarantees that no third-party network requests can be made. A security auditor can inspect the browser Network tab and verify zero external data egress in ten seconds.

---

## Summary Comparison

| Dimension | Server-Side MCP | Browser-Native WebMCP (Consensus) |
|---|---|---|
| **Document Location** | Server filesystem / cloud storage | Local browser memory (`ArrayBuffer`) |
| **Search Privacy** | Plaintext or embeddings sent to model | **0 characters** returned to model |
| **Permission Gate** | Prompt-level or server-wide allow/deny | **Page-by-page interactive human click** |
| **Network Egress** | Required (file streaming) | **Structurally blocked** via `connect-src 'self'` |
| **UI Integration** | Headless CLI / chat output only | **Live interactive DOM, matrix & animations** |
| **Data Resiliency** | Stored on server disk / database | **Ephemeral in-memory session** |
