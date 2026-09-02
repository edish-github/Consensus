import { ok, err, HINTS } from '../envelope';
import { DESCRIPTIONS } from '../descriptions';
import type { ToolDefinition } from '../types';
import { store } from '@/lib/store';
import { searchEvidence } from '@/lib/search/query';

/**
 * CLASS A · read-only · requires: documents
 *
 * ★ THE NOVEL TOOL. No longer a fixture — this searches the real local index.
 *
 * Returns WHERE matches are and never WHAT they say. The agent learns that
 * vendor-a-dpa.pdf page 13 has three matches at high relevance, and learns
 * nothing whatsoever about their contents.
 *
 * This is only expressible because execute() runs inside the process that
 * already holds the plaintext. A server-side MCP cannot implement it: to search
 * the documents server-side you must first upload them, at which point the
 * server has already read what it is pretending not to know.
 *
 * The security guarantee is enforced two layers down — see lib/search/index.ts
 * (storeFields excludes text) and lib/search/project.ts (output constructed,
 * never spread). Nothing in this file can leak text because nothing in this
 * file ever has any.
 */

interface Input {
  query: string;
  optionId?: string;
  limit?: number;
}

const WITHHELD_NOTE =
  'Text withheld by design. These are locations only. To read a page, call request_disclosure with a reason; the user approves or denies that specific page. Do not guess the contents.';

export const locateEvidence: ToolDefinition<Input, unknown> = {
  name: 'locate_evidence',
  description: DESCRIPTIONS.locate_evidence,
  requires: ['documents'],
  klass: 'A',
  annotations: { readOnlyHint: true, title: 'Locate evidence (no text returned)' },
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: "Search terms, e.g. 'SOC 2 availability exception'.",
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
        hint: 'Provide search terms, for example "SOC 2 availability exception".',
      });
    }

    const s = store.getState();

    if (s.documents.some((d) => d.status === 'parsing')) {
      return err('INDEX_NOT_READY', 'Documents are still parsing', {
        hint: HINTS.INDEX_PARSING,
        retryable: true,
      });
    }

    if (!s.indexReady) {
      return err('NOT_FOUND', 'No documents have been loaded into this session', {
        hint: 'Ask the user to drop their documents into the evidence vault first.',
      });
    }

    if (input?.optionId && !s.options.some((o) => o.id === input.optionId)) {
      return err('NOT_FOUND', `No option with id ${String(input.optionId)}`, {
        hint: HINTS.CALL_STATE_FOR_IDS,
      });
    }

    const limit = Math.min(Math.max(input?.limit ?? 8, 1), 20);
    const matches = searchEvidence(query, { optionId: input?.optionId, limit });

    return ok({
      query,
      matches,
      note: WITHHELD_NOTE,
      ...(matches.length === 0
        ? { hint: 'No matches. Try broader or different terms before concluding the documents are silent on this.' }
        : {}),
    });
  },
};
