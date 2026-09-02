# Sample corpus — synthetic

Five documents used to demonstrate Consensus and to rehearse the demo.

**Every company, person, date, figure and finding in these files is invented.**
NorthWind Analytics, Meridian Data Systems and Corvus Analytics do not exist.
Nothing here describes, is derived from, or reproduces any real organisation's
security posture, contract terms or pricing. No real SOC 2 report, DPA or
questionnaire response was used as a source.

They exist because the product's whole premise is documents you are not
permitted to upload — which means the demo cannot use real ones either.

| File | Pages | Scoped to |
|---|---|---|
| `vendor-a-dpa.pdf` | 21 | Vendor A |
| `vendor-a-security-questionnaire.pdf` | 13 | Vendor A |
| `vendor-b-soc2.pdf` | 31 | Vendor B |
| `vendor-b-dpa.pdf` | 17 | Vendor B |
| `vendor-c-pricing.pdf` | 7 | Vendor C |

## Two planted passages

The corpus is not filler. Two specific pages carry content the demo depends on,
and their locations are fixed:

**`vendor-a-dpa.pdf`, page 13 — section 7.4.** States that the EU subprocessor
arrangement "remained pending and had not been executed at the time of
publication", and that EU data residency is therefore not contractually
established. This contradicts a high data-residency score, and it is the
sentence the agent quotes back when it challenges the human at 1:50 in the demo.

**`vendor-b-soc2.pdf`, page 14 — section VI.** An availability-criterion
exception: capacity alerting disabled for 47 days, two undetected incidents.
This is what `locate_evidence` finds when asked about SOC 2 availability
exceptions.

Annex C of the DPA (page 21) corroborates the first: the EU subprocessor is
listed as "Pending — not executed", so an agent that reads both pages can build
a case rather than repeat one line.

## Regenerating

`scripts/gen_corpus.py` produces these deterministically. If you change it,
re-verify the two page numbers above — the fixtures, the demo script and the
eval protocol all reference them by page.

```bash
python3 scripts/gen_corpus.py public/sample
```
