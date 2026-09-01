# Batch 1 — Block 0 de-risk harness

Three stub tools, the real registry, and an on-screen test protocol. Zero new
dependencies. The point is to answer one question before building anything else.

## Install

Unzip into the repo root. Files land at:

```
types/webmcp.d.ts
lib/webmcp/{types,envelope,client,activity,registry,descriptions}.ts
lib/webmcp/tools/{_stubData,getDecisionState,locateEvidence,readSnippet,index}.ts
components/agent/{WebMCPProvider,ToolSurfacePanel}.tsx
app/page.tsx
app/d/[decisionId]/page.tsx
next.config.ts
```

## Two prerequisites

**1. Path alias.** Everything imports via `@/`. Confirm `tsconfig.json` has:

```json
{ "compilerOptions": { "paths": { "@/*": ["./*"] } } }
```

`create-next-app` sets this by default. If you chose `src/`, either move these
files under `src/` or change the alias to match.

**2. Ambient types.** `types/webmcp.d.ts` must be picked up. With the default
`"include": ["**/*.ts", "**/*.tsx", ".next/types/**/*.ts"]` it already is.

## Verify locally

```bash
pnpm dev
```

Open `http://localhost:3000/d/demo` in normal Chrome. Expect an amber banner
reading "WebMCP not detected" and an empty tool list. **That is the correct
result** — it proves the app works with no agent present, which is the fallback
if the agent misbehaves during the demo.

Then open the same URL in Chrome with `chrome://flags/#enable-webmcp-testing`
enabled. Banner goes green, three tools appear.

## Deploy

```bash
git add . && git commit -m "block 0: webmcp harness + permission stubs" && git push
```

Vercel gives you HTTPS automatically. WebMCP requires a secure context, so the
deployed URL is the real test surface — `localhost` counts as secure, but the
ChatGPT desktop browser needs a public URL.

## Run the test

Open the deployed URL in the **ChatGPT desktop app's built-in browser**. Check
the model is GPT-5.6 Sol or Terra; Luna has site tools disabled, and Enterprise
and Edu accounts do too.

The address-bar indicator should turn blue. Expand it and confirm three tools.

Then work the four prompts on the page, five runs each, recording verbatim.

**The one that decides the project is prompt 1.** The agent has been told where
an answer is and has been given no text. If it describes page 14's contents, it
is fabricating, and the two-tier disclosure design does not survive.

## Fixture map

| requestId | State | Exercises |
|---|---|---|
| `req_001` | requested | `PERMISSION_REQUIRED` — the wait path |
| `req_002` | denied | `PERMISSION_DENIED` — the refusal path |
| `req_003` | released | success — delimited text, page 13 of the DPA |

`req_003` returns the planted contradiction the demo climax turns on. Testing
against the real shape of the payoff from hour one is worth the ten minutes.

## What comes next

Once you have a verdict, batch 2 is B1-01 through B1-06: domain types, the
Zustand store, the matrix grid, the scoring engine, and the ranking animation.
The animation is scheduled early on purpose — it is on camera at the climax,
and things deferred to hour 50 look deferred.
