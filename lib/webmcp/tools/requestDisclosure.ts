import { ok, err, HINTS } from '../envelope';
import { DESCRIPTIONS } from '../descriptions';
import type { ToolDefinition } from '../types';
import { store } from '@/lib/store';
import { availablePages } from '@/lib/vault/readPage';

/**
 * CLASS B · gated · requires: documents
 *
 * Asks the human for permission to read one page of one document.
 *
 * NON-BLOCKING BY DESIGN. It creates a pending request and returns
 * immediately. It does not await the human's decision, because an agent that
 * blocks on a human is an agent that has stopped being useful — it should go
 * on locating other evidence while the person decides, and poll read_snippet.
 *
 * This tool grants nothing. It is a knock on a door.
 */

interface Input {
  documentId: string;
  page: number;
  reason: string;
}

export const requestDisclosure: ToolDefinition<Input, unknown> = {
  name: 'request_disclosure',
  description: DESCRIPTIONS.request_disclosure,
  requires: ['documents'],
  klass: 'B',
  gated: true,
  annotations: { title: 'Ask to read a page' },
  inputSchema: {
    type: 'object',
    properties: {
      documentId: { type: 'string', description: 'From locate_evidence or list_documents.' },
      page: { type: 'integer', minimum: 1 },
      reason: {
        type: 'string',
        maxLength: 200,
        description: 'Why you need this page. The user reads this before deciding.',
      },
    },
    required: ['documentId', 'page', 'reason'],
    additionalProperties: false,
  },

  async execute(input) {
    const documentId = typeof input?.documentId === 'string' ? input.documentId : '';
    const page = Number(input?.page);
    const reason = typeof input?.reason === 'string' ? input.reason.trim() : '';

    if (!documentId || !Number.isInteger(page) || page < 1) {
      return err('VALIDATION_FAILED', 'documentId and a positive integer page are required', {
        hint: 'Use the documentId and page from a locate_evidence result.',
      });
    }
    if (!reason) {
      return err('VALIDATION_FAILED', 'reason is required', {
        hint: 'State why you need this page. The user sees this text and decides on it.',
      });
    }

    const s = store.getState();
    const doc = s.documents.find((d) => d.id === documentId);
    if (!doc) {
      return err('NOT_FOUND', `No document with id ${documentId}`, {
        hint: 'Call list_documents for valid document ids.',
      });
    }

    const pages = availablePages(documentId);
    if (!pages.includes(page)) {
      return err('NOT_FOUND', `Page ${page} has no extractable text in ${doc.filename}`, {
        hint: 'Pick a page that appeared in a locate_evidence result.',
      });
    }

    const result = s.createRequest(documentId, page, reason);

    if (!result.ok) {
      if (result.code === 'RATE_LIMITED') {
        return err('RATE_LIMITED', 'Twelve requests are already awaiting the user', {
          hint: HINTS.TOO_MANY_PENDING,
          retryable: true,
        });
      }
      return err('PERMISSION_DENIED', `The user has refused ${doc.filename} page ${page} twice`, {
        hint: HINTS.DO_NOT_REREQUEST,
        retryable: false,
      });
    }

    return ok({
      status: 'pending',
      requestId: result.requestId,
      filename: doc.filename,
      page,
      reRequest: result.reRequest,
      note: 'A card is now in front of the user showing your reason. This returns immediately and grants nothing. Continue with other work, then call read_snippet with this requestId to see whether they approved.',
    });
  },
};
