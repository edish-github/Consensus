import { store } from '@/lib/store';
import { selectRanking, selectGaps, selectFlip } from '@/lib/store/selectors';
import { contributionsFor } from '@/lib/scoring/rank';
import { scoreKey } from '@/lib/types';

/**
 * The decision brief.
 *
 * This is the artifact that outlives the session. Six months from now, when
 * the vendor fails an audit and someone asks what was known at the time, this
 * is the answer — every score, where it came from, what supported it, and the
 * complete record of which pages were released to reach it.
 *
 * Two things it deliberately includes that a normal export would not:
 *
 *  · SCORES WITH NO SOURCE, listed as such. A brief that quietly omitted its
 *    weak points would be a worse artifact than one that names them.
 *
 *  · THE DISCLOSURE LEDGER, including denials. The record of what you refused
 *    to show the agent is part of how the decision was made.
 */
export function buildDecisionBrief(): string {
  const s = store.getState();
  const ranking = selectRanking(s);
  const gaps = selectGaps(s);
  const flip = selectFlip(s);

  const name = (list: { id: string; name: string }[], id: string) =>
    list.find((x) => x.id === id)?.name ?? id;
  const optionName = (id: string) => name(s.options, id);
  const criterionName = (id: string) => name(s.criteria, id);
  const filename = (id: string) => s.documents.find((d) => d.id === id)?.filename ?? id;

  const out: string[] = [];
  const now = new Date();

  out.push(`# ${s.decisionTitle}`, '');
  out.push(`Decision brief generated ${now.toLocaleString()}.`, '');

  /* ── Recommendation ─────────────────────────────────────────────── */
  const leader = ranking[0];
  if (leader && leader.scoredCount > 0) {
    out.push('## Where this landed', '');
    out.push(
      `**${leader.name}** leads on a weighted score of ${Math.round(leader.normalised * 100)}` +
        ` with ${Math.round(leader.completeness * 100)}% of its criteria scored.`
    );
    if (leader.completeness < 1) {
      out.push('', '> This lead is provisional. Not every criterion has been scored.');
    }
    out.push('', flip.summary, '');
  }

  /* ── Ranking ────────────────────────────────────────────────────── */
  out.push('## Ranking', '');
  out.push('| Rank | Option | Weighted | Complete |', '|---|---|---|---|');
  for (const r of ranking) {
    out.push(
      `| ${r.rank} | ${r.name} | ${r.scoredCount > 0 ? Math.round(r.normalised * 100) : '—'} | ${Math.round(r.completeness * 100)}% |`
    );
  }
  out.push('');

  /* ── Criteria ───────────────────────────────────────────────────── */
  out.push('## Criteria and weights', '');
  out.push('| Criterion | Weight | Origin |', '|---|---|---|');
  for (const c of s.criteria) {
    const origin = c.createdBy === 'human' ? 'you' : 'agent proposed, you accepted';
    out.push(`| ${c.name} | ${c.weight} | ${origin} |`);
  }
  out.push('', '_Weights are human-only. No agent tool can write one._', '');

  /* ── Scores with provenance ─────────────────────────────────────── */
  out.push('## Scores', '');
  for (const option of s.options) {
    out.push(`### ${option.name}`, '');
    const contributions = contributionsFor(option.id, s.criteria, s.scores);

    for (const c of contributions) {
      const score = s.scores[scoreKey(option.id, c.criterionId)];
      if (!score) {
        out.push(`- **${c.criterionName}** — not scored`);
        continue;
      }

      const origin = score.source === 'human' ? 'you' : 'agent proposed, you accepted';
      out.push(`- **${c.criterionName}: ${score.value}/5** (${origin}, weight ${c.weight})`);
      if (score.rationale) out.push(`  - ${score.rationale}`);

      if (score.evidenceRefs.length > 0) {
        for (const ref of score.evidenceRefs) {
          out.push(`  - Source: \`${filename(ref.documentId)}\` p.${ref.page}`);
        }
      } else {
        out.push('  - ⚠ No supporting document cited.');
      }
    }
    out.push('');
  }

  /* ── Open challenges ────────────────────────────────────────────── */
  const openChallenges = s.challenges.filter((c) => c.state === 'open');
  if (openChallenges.length > 0) {
    out.push('## Unresolved challenges', '');
    out.push('Your agent disputed these scores and you have not resolved the disagreement.', '');
    for (const challenge of openChallenges) {
      out.push(
        `- **${optionName(challenge.optionId)} · ${criterionName(challenge.criterionId)}** ` +
          `(you scored ${challenge.disputedValue})`
      );
      out.push(`  - ${challenge.argument}`);
      for (const ref of challenge.evidenceRefs) {
        out.push(`  - Cited: \`${filename(ref.documentId)}\` p.${ref.page}`);
      }
      for (const ref of challenge.unreadRefs) {
        out.push(`  - Not released to the agent: \`${filename(ref.documentId)}\` p.${ref.page}`);
      }
    }
    out.push('');
  }

  /* ── Gaps ───────────────────────────────────────────────────────── */
  if (gaps.unscoredCells.length > 0 || gaps.scoresWithoutEvidence.length > 0) {
    out.push('## What this decision does not rest on', '');
    if (gaps.unscoredCells.length > 0) {
      out.push(`- ${gaps.unscoredCells.length} cells have no score.`);
    }
    if (gaps.scoresWithoutEvidence.length > 0) {
      out.push(
        `- ${gaps.scoresWithoutEvidence.length} scores carry no supporting document:`
      );
      for (const cell of gaps.scoresWithoutEvidence) {
        out.push(`  - ${optionName(cell.optionId)} · ${criterionName(cell.criterionId)}`);
      }
    }
    out.push('');
  }

  /* ── Evidence ───────────────────────────────────────────────────── */
  out.push('## Evidence considered', '');
  if (s.documents.length === 0) {
    out.push('_No documents were loaded._', '');
  } else {
    out.push('| Document | Pages | Scoped to |', '|---|---|---|');
    for (const doc of s.documents) {
      out.push(
        `| \`${doc.filename}\` | ${doc.pageCount} | ${doc.optionId ? optionName(doc.optionId) : '—'} |`
      );
    }
    out.push('');
    out.push(
      '_Documents were parsed in the browser and never uploaded. Only the pages listed below were shown to the agent._',
      ''
    );
  }

  /* ── Disclosure ledger ──────────────────────────────────────────── */
  out.push('## Disclosure ledger', '');
  if (s.ledger.length === 0) {
    out.push('_No page was ever released to the agent._', '');
  } else {
    const released = s.ledger.filter((e) => e.decision === 'approved');
    const denied = s.ledger.filter((e) => e.decision === 'denied');
    out.push(
      `${released.length} ${released.length === 1 ? 'page' : 'pages'} released, ` +
        `${denied.length} declined.`,
      ''
    );
    out.push('| Decision | Document | Page | Reason given | Chars | Hash |', '|---|---|---|---|---|---|');
    for (const entry of [...s.ledger].reverse()) {
      out.push(
        `| ${entry.decision} | \`${entry.filename}\` | ${entry.page} | ${entry.reason} | ` +
          `${entry.charactersReleased || '—'} | ${entry.textHash || '—'} |`
      );
    }
    out.push('');
  }

  /* ── Method ─────────────────────────────────────────────────────── */
  out.push('## Method', '');
  out.push(
    'Weighted total is the sum of score × weight over scored cells only. Unscored',
    'cells are excluded from both the total and the maximum, so an option is not',
    'penalised for being incompletely evaluated — which is why completeness is',
    'reported separately.',
    '',
    'The agent could search these documents and see where matches were, but could',
    'not read any page without an explicit release recorded above. It could propose',
    'scores and argue against them; it could not set one.',
    '',
    `Generated by Consensus. ${s.documents.length} documents, ` +
      `${s.documents.reduce((n, d) => n + d.pageCount, 0)} pages, none uploaded.`
  );

  return out.join('\n');
}

/** Triggers a client-side download. No server, no round trip. */
export function downloadDecisionBrief(): void {
  const markdown = buildDecisionBrief();
  const title = store.getState().decisionTitle.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${title || 'decision'}-brief.md`;
  a.click();
  URL.revokeObjectURL(url);
}
