# Why WebMCP

**The argument for browser-native MCP over every alternative, when the data is
confidential and local.**

This is the section a judge reads first, so it opens with the conclusion.

---

## The requirement

> **An agent that can tell you where the answer is in a document it is not
> permitted to read.**

Unusual, and precise. Hold it in mind while reading what follows, because every
alternative fails against this specific sentence rather than against a vague
notion of "agentic web good".

![Why WebMCP](diagrams/16-why-webmcp-comparison.svg)

---

## 1 · Server-side MCP cannot express it at all

This is not a performance argument or a latency argument. It is a definitional
one.

For a server MCP to search the documents, **the documents must be on the
server.** Uploading them is the exact action the user is contractually
forbidden to take — that prohibition is the entire premise of the product.

And once uploaded, the primitive collapses. A server that holds the plaintext
has already read what it is pretending not to know. "Find without read" running
server-side is theatre: the server knows, and is declining to say.

The split between *knowing where* and *knowing what* only means anything when
the thing doing the searching is a process the user already trusts with the
plaintext — because it is running on their own machine, in their own tab, on
bytes they dropped in themselves.

**A server MCP is not inconvenient here. It is unavailable.**

### The counter-argument, and why it fails

*"Encrypt client-side, search server-side over ciphertext."*

Searchable encryption exists. It is also slow, leaks access patterns, requires
key management the user must not get wrong, and — decisively — the user still
has to transmit the document. The NDA does not say "do not transmit in
plaintext." It says do not disclose.

*"Run the MCP server on localhost."*

Closer, and genuinely interesting. But now the user installs and runs a local
binary, the agent needs a transport to reach it, and the documents live on disk
rather than in a tab that closes. You have rebuilt the browser badly. And you
still have no shared visual surface — see §2.

---

## 2 · A REST API has no shared surface

Suppose the search problem were solved. The interaction still fails.

Per-page approval requires **both parties looking at the same live page at the
same moment.** The agent asks; a card appears in front of the human; the human
reads the agent's stated reason and decides; the agent's next call sees the new
state.

A REST API has no card. It has no "in front of the human". The human cannot
watch the agent work, cannot interrupt mid-sequence, and cannot approve a
specific disclosure in the flow of the interaction rather than in a separate
admin screen minutes later.

The approval would have to happen somewhere else, at some other time, out of
context. At which point it is a permissions dashboard, not a conversation — and
people do not read permissions dashboards.

**What WebMCP provides here is not a channel. It is co-presence.**

---

## 3 · Browser automation defeats the boundary rather than enforcing it

Playwright, computer-use agents, and screen-reading automation all fail for the
same reason, and it is worth being precise about it.

**They cannot join a session; they can only drive a new one.** The documents in
Consensus were dropped in by the user, parsed into memory, indexed. There is no
URL that reconstitutes that state. An automation harness opening the app fresh
finds an empty vault.

**And to know what a document says, they must read the screen.** Which sends
the confidential text through a screenshot into the model — the precise
disclosure the entire product exists to prevent, arriving through the side door.

Automation is not a weaker version of the boundary. It is the boundary's
opposite: an agent that sees everything rendered and cannot be told not to.

There is also the ordinary objection — DOM scraping is brittle, a class rename
breaks it, and there is no structured contract. But that is the small problem.
The large one is that reading the screen is itself the leak.

---

## 4 · An OS-level or extension agent has no contract

A browser extension or desktop agent with filesystem access can read the
documents directly. So the search works.

But there is no way to express: **"you may know this file exists and may not
know what it says."**

The permission model is all-or-nothing at the wrong granularity — a folder, a
domain, an application. Not a page of a document, for one query, with a stated
reason, logged.

WebMCP's tool boundary is the enforcement mechanism. `locate_evidence` returns
metadata because that is what the function returns; `read_snippet` returns text
because a human released that page. The contract is per-call, and the schema is
part of it.

---

## 5 · What only WebMCP provides

Five properties, and Consensus depends on all five.

### 5.1 `execute()` runs inside the process holding the plaintext

The single fact everything else follows from. The tool function has the
documents in memory, in the user's own tab, and can therefore answer questions
*about* them without transmitting them.

This is what makes search and disclosure **separate capabilities** rather than
two names for the same thing.

### 5.2 A per-call contract with a schema

Not "the agent can see the page". A named function, a JSON Schema, an
annotation model — `readOnlyHint` for tools that change nothing,
`untrustedContentHint` for output carrying third-party content.

The agent knows `locate_evidence` is free and `read_snippet` is gated because
the surface tells it so.

### 5.3 Shared live state

The state the tools mutate is the same object the UI renders. Not synchronised
copies — the same object.

This is why the store is Zustand created at module scope rather than React
Context: a tool's `execute()` runs from the WebMCP host, outside React, and
cannot use hooks. That constraint is what makes "the human and the agent are
looking at one artifact" literally true.

### 5.4 The authenticated session, for free

Consensus does not need this — it has no auth — but it is the property that
makes WebMCP matter beyond this app. A tool running in the page inherits the
user's cookies and session. No OAuth dance, no token storage, no separate
credential for the agent.

### 5.5 Dynamic, reversible capability

The tool surface changes as page state changes, **in both directions**. Delete
every document and the three document tools unregister; the agent's list shrinks
in front of you.

A server MCP exposes a fixed catalogue. It cannot know that this user, right
now, has nothing to search.

![Capability gating](diagrams/07-capability-gated-registration.svg)

---

## 6 · The thing that becomes possible

Not "faster" or "more convenient". Different in kind.

**Before:** you chose between using your documents and using your AI.
Confidential material meant no AI assistance, or an NDA violation. There was no
third option.

**Now:** you and an agent reason together over documents the agent is never
given. It reads the *shape* of your evidence — where the density of relevant
content sits, which pages look load-bearing, which cells in your matrix have no
support — and negotiates with you for access, one page at a time, with a stated
reason each time.

![Find without read](diagrams/04-find-without-read-sequence.svg)

The interaction this produces is unlike what agent products usually
demonstrate. **The agent's only power is persuasion.**

It cannot set your score. It can locate three pages that contradict you, tell
you honestly that it has not read them, and ask.

In the demo, that is exactly what happens: a human enters a score from memory,
the agent challenges it, the human releases one page, and the agent quotes the
human's own document back at them. The human changes their mind and the ranking
inverts.

**An agent that changed your mind using evidence you controlled the release of,
from a document that never left your machine, was not previously buildable.**

---

## 7 · Honest limits

Where WebMCP is *not* the right answer, stated so the argument above is
credible.

**Anything genuinely server-side.** If the data already lives on a server and
the user has authorised it, a server MCP is simpler, testable in CI, and does
not depend on a browser being open. Most integrations are this, and should be.

**Long-running or scheduled work.** WebMCP tools are per-document and ephemeral
— they exist while the page is open. An agent that must run for an hour, or at
3am, needs a server.

**Anything requiring durable state across sessions.** Consensus turns this into
a feature (a session boundary is a permission boundary), but it is a real
constraint. A CRM integration should not lose everything on refresh.

**Multi-agent or headless orchestration.** No page, no tools.

WebMCP earns its place precisely where the data is local, the session is the
security boundary, and the human is present. That is a narrower slice than the
"agentic web" framing suggests — and Consensus sits squarely in it, which is why
the argument works here rather than being a general claim about the standard.

---

## 8 · How it is implemented

Briefly, since the details live in [`ARCHITECTURE.md`](ARCHITECTURE.md).

**Ten tools**, registered imperatively on the top-level document with
`document.modelContext.registerTool()`. No declarative form tools, no iframes —
ChatGPT's built-in browser discovers neither.

**Three capability classes**, reflected in annotations and in the UI: four
read-only, two gated, four proposal.

**Capability-gated registration.** Each tool declares what it needs
(`requires: ['documents']`); the registry diffs the desired set against the
registered set on every state change. Idempotent, refcounted, with an
`AbortController` per tool.

**Schemas written twice on purpose** — JSON Schema for the agent, a Zod mirror
for runtime validation — so a malformed argument produces a structured error
rather than a thrown exception.

**A structured error envelope with actionable hints.**
`PERMISSION_DENIED` carries *"do not re-request; say what you cannot verify and
continue"*, which is behavioural steering rather than decoration. Without it,
agents retry or invent.

**Descriptions written to Chrome's published budgets** and linted by a test,
with a second lint asserting no two descriptions overlap enough to confuse tool
selection.

---

## Related

- [`SECURITY.md`](SECURITY.md) — the complete security model
- [`ARCHITECTURE.md`](ARCHITECTURE.md) — constraints, data model, tool catalogue
- [`../evals/RESULTS.md`](../evals/RESULTS.md) — what we tested and what we found
