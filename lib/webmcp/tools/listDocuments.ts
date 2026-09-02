import { ok } from '../envelope';
import { DESCRIPTIONS } from '../descriptions';
import type { ToolDefinition } from '../types';
import { store } from '@/lib/store';

/**
 * CLASS A · read-only · requires: nothing
 *
 * Filenames, page counts, option scoping and parse status. No content.
 *
 * Registered unconditionally so the agent can discover that the vault is empty
 * and say so, rather than calling locate_evidence and receiving an error. An
 * agent that can see the shape of the workspace asks better questions.
 */

interface Input {
  optionId?: string;
}

export const listDocuments: ToolDefinition<Input, unknown> = {
  name: 'list_documents',
  description: DESCRIPTIONS.list_documents,
  requires: [],
  klass: 'A',
  annotations: { readOnlyHint: true, title: 'List loaded documents' },
  inputSchema: {
    type: 'object',
    properties: {
      optionId: {
        type: 'string',
        description: 'Optional. Restrict to documents scoped to one option.',
      },
    },
    additionalProperties: false,
  },

  async execute(input) {
    const s = store.getState();
    const optionName = (id?: string) =>
      id ? s.options.find((o) => o.id === id)?.name : undefined;

    const documents = s.documents
      .filter((d) => !input?.optionId || d.optionId === input.optionId)
      .map((d) => ({
        documentId: d.id,
        filename: d.filename,
        pageCount: d.pageCount,
        optionId: d.optionId,
        option: optionName(d.optionId),
        status: d.status,
        ...(d.error ? { error: d.error } : {}),
      }));

    return ok({
      documents,
      totalPages: documents.reduce((n, d) => n + d.pageCount, 0),
      note:
        documents.length === 0
          ? 'No documents loaded. Ask the user to add them before searching for evidence.'
          : 'Contents are not included. Use locate_evidence to find where relevant material sits.',
    });
  },
};
