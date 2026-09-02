import { ok, err, HINTS } from '../envelope';
import { DESCRIPTIONS } from '../descriptions';
import type { ToolDefinition } from '../types';
import { STUB_MATCHES, STUB_DOCUMENTS } from './_stubData';

/**
 * CLASS A · read-only · phase 1
 *
 * ★ THE NOVEL TOOL. Read this one first.
 *
 * Search returns WHERE the answer is and never WHAT it says. The agent learns
 * that vendor-b-soc2.pdf page 14 has three matches at high relevance, and
 * learns nothing about their contents.
 *
 * This is only expressible because execute() runs inside the process that
 * already holds the plaintext. A server-side MCP cannot implement it: to
 * search the documents server-side you must first upload them, at which point
 * the server has already read what it is pretending not to know.
 *
 * ══════════════════════════════════════════════════════════════════════════
 *  DO NOT ADD A TEXT FIELD TO THIS TOOL'S OUTPUT.
 *  Not a preview. Not a highlighted excerpt. Not "just the matched term".
 *  evals/security.spec.ts fuzzes 200 queries against every 20-character
 *  shingle of the corpus and asserts zero matches in this output.
 *  If you need text, that is what request_disclosure exists for.
 * ══════════════════════════════════════════════════════════════════════════
 *
 * BLOCK 0 STUB — returns fixture matches. Replaced in B2-05 with a real
 * MiniSearch query through lib/search/project.ts.
 */

interface Input {
  query: string;
  optionId?: string;
  limit?: number;
}

interface EvidenceLocation {
  documentId: string;
  filename: string;
  page: number;
  /** Number of distinct sub-chunks on this page that matched. Never the text. */
  matchCount: number;
  relevance: number;
  sealState: 'sealed' | 'requested' | 'released' | 'denied';
}

interface Output {
  query: string;
  matches: EvidenceLocation[];
  /**
   * Teaching the protocol inside the result.
   *
   * This field moved agent behaviour more than any amount of tuning the tool
   * description did. The description is read once, when the tool list is
   * assembled. The result is read at the moment the agent decides what to do
   * next — which is exactly when it needs to be told that text was withheld
   * on purpose and that asking is the correct move.
   */
  note: string;
}

const WITHHELD_NOTE =
  'Text withheld by design. These are locations only. To read a page, call request_disclosure with a reason; the user will approve or deny that specific page. Do not guess the contents.';

export const locateEvidence: ToolDefinition<Input, Output> = {
  name: 'locate_evidence',
  description: DESCRIPTIONS.locate_evidence,
  requires: ['documents'],
  minPhase: 1,
  klass: 'A',
  annotations: { readOnlyHint: true, title: 'Locate evidence (no text returned)' },
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: "Search terms, e.g. 'SOC2 availability exception'.",
      },
      optionId: {
        type: 'string',
        description: "Optional. Restrict the search to one option's documents.",
      },
      limit: { type: 'integer', minimum: 1, maximum: 20, default: 8 },
    },
    required: ['query'],
    additionalProperties: false,
  },
  async execute(input) {
    const query = typeof input?.query === 'string' ? input.query.trim() : '';
    if (!query) {
      return err('VALIDATION_FAILED', 'query must be a non-empty string', {
        hint: 'Provide search terms, for example "SOC2 availability exception".',
      });
    }

    if (STUB_DOCUMENTS.some((d) => d.status !== 'ready')) {
      return err('INDEX_NOT_READY', 'Documents are still parsing', {
        hint: HINTS.INDEX_PARSING,
        retryable: true,
      });
    }

    const limit = Math.min(Math.max(input?.limit ?? 8, 1), 20);
    const matches = STUB_MATCHES
      .filter((m) => !input?.optionId || m.optionId === input.optionId)
      .slice(0, limit)
      .map(({ optionId: _optionId, ...rest }) => rest);

    return ok({ query, matches, note: WITHHELD_NOTE });
  },
};
