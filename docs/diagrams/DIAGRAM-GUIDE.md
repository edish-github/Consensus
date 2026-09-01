# Diagram Guide — Consensus

22 Mermaid sources in `src/`, rendered to `svg/` and `png/`. Every diagram has been validated by rendering; none contain syntax errors.

---

## Render

```bash
npm i -g @mermaid-js/mermaid-cli
./render.sh
```

Renders all 22 to `svg/` (for the repo, crisp at any zoom) and `png/` at 2× (for Devpost, which does not accept SVG in the gallery).

On Linux you may need the included `puppeteer-config.json` for the sandbox flags. It is already wired into `render.sh`.

---

## Colour system

The palette is the argument. A reader who understands only the colours already understands the security model.

| Colour | Meaning | Hex |
|---|---|---|
| 🔴 Red / pink | **Plaintext.** Confidential content that never leaves the tab. | `fill:#ffe0e0 stroke:#c04040` |
| 🔵 Blue | **The gate.** The boundary and everything that enforces it. | `fill:#dce8ff stroke:#4070c0` |
| 🟣 Purple | **Human.** Actions only a person can take. | `fill:#ece0ff stroke:#8050c0` |
| 🟢 Green | **Agent.** What the agent can see and call. | `fill:#e0f5e6 stroke:#40a060` |
| 🟡 Amber | **Application core.** Store, scoring, proposals. | `fill:#fff2d9 stroke:#c08820` |
| ⚪ Grey dashed | **Deliberately absent.** Things that do not exist, on purpose. | `fill:#f0f0f0 stroke:#999 dasharray` |

Rule: if a node holds or transports confidential text it is red. If it decides whether text may cross, it is blue. There are no exceptions, so a judge scanning a diagram can trace the red-to-blue-to-green path and see the whole thesis in about four seconds.

---

## Index

★ marks the diagrams that carry the submission. If only five are used, use those five.

| # | File | Type | What it proves |
|---|---|---|---|
| 01 ★ | `01-system-architecture` | flowchart | The whole system as one downward trust path. **The hero image.** |
| 02 ★ | `02-trust-boundary` | flowchart | What leaves the browser and what never does. The most persuasive single artifact. |
| 03 | `03-disclosure-gate-state-machine` | stateDiagram | Page seal lifecycle, and that only one code path reaches RELEASED. |
| 04 ★ | `04-find-without-read-sequence` | sequence | The novel primitive, step by step. If a judge reads one diagram, this one. |
| 05 ★ | `05-capability-boundary` | flowchart | Agent owns evidence, human owns values, with the absent tools shown. |
| 06 | `06-tool-surface-map` | flowchart | All 10 tools, 3 classes, disjoint verbs, annotations. |
| 07 | `07-dynamic-registration-phases` | stateDiagram | Phase 0→3 registration, including reverse transitions. |
| 08 | `08-ingestion-pipeline` | flowchart | PDF → worker → chunks → index, and where bytes are discarded. |
| 09 | `09-metadata-projection` | flowchart | The security-critical function, and the two independent barriers. |
| 10 | `10-scoring-engine` | flowchart | The ranking maths, kept simple enough to be trusted. |
| 11 ★ | `11-challenge-climax-sequence` | sequence | The 1:30 demo moment as a protocol trace. |
| 12 | `12-technology-stack-mindmap` | mindmap | The full stack at a glance. |
| 13 | `13-data-model-er` | erDiagram | Entities, and that plaintext lives in exactly one field. |
| 14 | `14-deployment-architecture` | flowchart | Vercel, the CSP, and the deliberately absent backend. |
| 15 | `15-build-timeline` | gantt | 72 hours, six blocks, three gates. |
| 16 ★ | `16-why-webmcp-comparison` | flowchart | The same feature attempted four other ways, each failing. |
| 17 | `17-threat-model` | flowchart | Prompt injection defences and every closed leak path. |
| 18 | `18-error-contract` | flowchart | Agent Experience as a design surface. Aimed at Sean Roberts. |
| 19 | `19-eval-harness` | flowchart | The security claim as a passing test, plus the 12-prompt protocol. |
| 20 | `20-personas-and-jobs` | flowchart | Who this is for, and who it is explicitly not for. |
| 21 | `21-demo-shot-map` | gantt | The 3-minute video, second by second. |
| 22 | `22-judging-criteria-map` | flowchart | Every criterion mapped to a nameable artifact. |

---

## Placement

| Destination | Diagrams | Why |
|---|---|---|
| **Devpost description** | 01, 02, 04, 05, 16, 11, 12, 15 | Eight images. Enough to carry the narrative, not so many that they scroll past. |
| **README first screen** | 02 | The what-leaves-your-browser image answers the judge's first question before they ask it. |
| **README body** | 01, 06, 07, 03 | Architecture, tools, registration, gate. |
| **docs/SECURITY.md** | 02, 03, 09, 17 | The complete security case in four images. |
| **docs/WHY-WEBMCP.md** | 16, 04 | The argument and the proof. |
| **docs/ARCHITECTURE.md** | all | Full reference. |
| **Video** | 21 as your own shot list; do not show diagrams on camera | Three minutes is too short to read a diagram. |

---

## Editing conventions

- **Front matter title.** Every file opens with a `---` block containing `title:`. This renders as the diagram heading and keeps the file self-describing.
- **`<br/>` for line breaks** inside node labels. Never a literal newline.
- **`·` as an inline separator** rather than commas, which read as list punctuation in dense labels.
- **No parentheses in unquoted labels.** Mermaid treats them as shape syntax. Use `["text"]` if needed.
- **No colons in `timeline` or `gantt` task text.** Both parsers use `:` as a delimiter. This is why diagram 21 is a gantt rather than a timeline.
- **`classDef` at the bottom**, `class` assignments last. Keeps diffs readable.
- **Bold the claim.** In every diagram there is one `<b>` node that states the point of the diagram. A reader skimming for bold text gets the argument.

---

## Regeneration discipline

`src/*.mmd` is the source of truth. Never hand-edit an SVG. If a diagram and the code disagree, the diagram is wrong and must be updated in the same commit as the code change. The tool table in `docs/TOOLS.md` is generated by `scripts/gen-tool-table.ts` for exactly this reason, and diagram 06 must be checked against it before submission.
