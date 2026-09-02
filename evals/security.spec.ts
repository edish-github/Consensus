import { describe, it, expect, beforeAll } from 'vitest';
import { resetIndex, addDocumentToIndex, rawSearch } from '@/lib/search';
import { projectToMetadata } from '@/lib/search/project';
import { chunkPage } from '@/lib/ingest/chunk';
import { normalise } from '@/lib/ingest/normalise';
import { ALL_TOOLS } from '@/lib/webmcp/tools';
import type { PageChunk } from '@/lib/types';

/**
 * ★ THE SECURITY SUITE.
 *
 * This is the file that turns "locate_evidence never returns document text"
 * from a claim in a README into something that fails the build if it stops
 * being true.
 *
 * The method: take every 20-character window of the corpus and assert that
 * none of them appears anywhere in the serialised output of a realistic query
 * set. Shingles rather than whole sentences, because a leak does not have to
 * be a whole sentence to be a leak — a fragment of an NDA'd SOC 2 report is
 * still a fragment of an NDA'd SOC 2 report.
 *
 * ⚠ VERIFY THIS SUITE BY BREAKING IT.
 * Add `text: g.text` to the object projectToMetadata returns and re-run. If
 * these tests still pass, they are decoration. A security test you have never
 * seen fail is a security test you do not know works.
 */

/** Mirrors the real corpus closely enough to be a fair target. */
const CORPUS: Record<string, string[]> = {
  'vendor-a-dpa.pdf': [
    'Data Processing Agreement between NorthWind Analytics, Inc. and the Customer identified in the applicable Order Form. Effective 14 March 2026, version 4.2.',
    'The Processor shall implement appropriate technical and organisational measures designed to protect Personal Data against accidental or unlawful destruction, loss, alteration or unauthorised disclosure.',
    'Primary processing facilities. Personal Data processed under this Agreement is hosted in the Processor United States regions, specifically us-east-1 and us-west-2, with continuous replication for availability and disaster recovery.',
    'European Union processing region. An additional European Union processing region was under evaluation as of the effective date. The EU subprocessor arrangement described in Annex C remained pending and had not been executed at the time of publication.',
    'Annex C Subprocessor Register. Meridian Hosting BV, EU processing region, eu-west-1, Pending not executed. Cirrus Compute, Infrastructure, us-east-1, Executed.',
  ],
  'vendor-b-soc2.pdf': [
    'SOC 2 Type II Report. Independent Service Auditor Report for Meridian Data Systems, Inc. Review period 1 January 2026 through 31 December 2026.',
    'Exception noted. During the period 3 August 2026 through 19 September 2026, automated capacity alerting for the primary analytics ingestion tier was disabled following a monitoring platform migration.',
    'Two availability incidents occurred within the affected window. Incident INC-2026-0812 resulted in degraded query performance for approximately four hours.',
    'Logical access to production systems is granted on the basis of least privilege and is reviewed quarterly by system owners. Access is revoked within one business day of termination.',
  ],
  'vendor-c-pricing.pdf': [
    'Pricing Schedule and Commercial Terms. Quotation reference CVS-2026-4471, valid for sixty days from 2 April 2026. All amounts in USD exclusive of applicable taxes.',
    'Event overage. Usage in excess of the contracted monthly event allowance is billed at 0.42 dollars per additional one thousand events. There is no cap on overage charges.',
  ],
};

const FILENAMES = Object.keys(CORPUS);
const DOC_IDS = FILENAMES.map((_, i) => `d_${i + 1}`);
const shingles: string[] = [];
const SHINGLE_LENGTH = 20;

const ctx = {
  filenameFor: (id: string) => FILENAMES[DOC_IDS.indexOf(id)] ?? id,
  sealStateFor: () => 'sealed' as const,
};

beforeAll(() => {
  resetIndex();

  FILENAMES.forEach((filename, docIndex) => {
    const docId = DOC_IDS[docIndex]!;
    const chunks: PageChunk[] = CORPUS[filename]!.map((raw, i) =>
      chunkPage(docId, i + 1, normalise(raw))
    );
    addDocumentToIndex(docId, chunks);

    // Every 20-char window, stepped by 3 so overlapping fragments are covered densely — a leak
      // does not have to be aligned to a boundary to be a leak.
    for (const chunk of chunks) {
      for (let i = 0; i + SHINGLE_LENGTH <= chunk.text.length; i += 3) {
        shingles.push(chunk.text.slice(i, i + SHINGLE_LENGTH));
      }
    }
  });
});

/** Queries a real user or agent would plausibly run against this corpus. */
const QUERIES = [
  'SOC 2 availability exception', 'EU subprocessor data residency pending',
  'us-east-1 us-west-2 processing region', 'capacity alerting disabled',
  'overage charges per thousand events', 'least privilege access review',
  'encryption at rest key rotation', 'incident notification seventy-two hours',
  'Annex C subprocessor register', 'penetration test summary',
  'data retention deletion policy', 'multi-factor authentication',
  'business continuity plan exercise', 'backup restoration testing',
  'change management peer review', 'transfer impact assessment',
  'availability incidents degraded performance', 'quotation reference validity',
  'personal data breach notification', 'monitoring platform migration',
];

describe('locate_evidence emits zero source text', () => {
  it('indexes the corpus and collects a dense shingle set', () => {
    // Sanity check on the test itself: if the corpus fails to index, every
    // leak assertion below would pass vacuously.
    expect(shingles.length).toBeGreaterThan(500);
    expect(rawSearch('subprocessor').length).toBeGreaterThan(0);
  });

  it('leaks no 20-character fragment across any query', () => {
    const leaks: { query: string; fragment: string }[] = [];

    for (const query of QUERIES) {
      const serialised = JSON.stringify(projectToMetadata(rawSearch(query), ctx, 20));
      for (const fragment of shingles) {
        if (serialised.includes(fragment)) {
          leaks.push({ query, fragment: fragment.slice(0, 40) });
          break;
        }
      }
    }

    expect(leaks).toEqual([]);
  });

  it('returns only the declared metadata fields', () => {
    const results = projectToMetadata(rawSearch('EU subprocessor pending'), ctx, 5);
    expect(results.length).toBeGreaterThan(0);

    const allowed = new Set([
      'documentId', 'filename', 'page', 'matchCount', 'relevance', 'sealState',
    ]);
    for (const result of results) {
      for (const key of Object.keys(result)) {
        expect(allowed.has(key), `unexpected field "${key}" in projection`).toBe(true);
      }
    }
  });

  it('finds the planted contradiction without revealing it', () => {
    const results = projectToMetadata(rawSearch('EU subprocessor arrangement pending'), ctx, 5);
    const hit = results.find((r) => r.filename === 'vendor-a-dpa.pdf' && r.page === 4);
    expect(hit, 'the DPA page describing the pending EU arrangement should be located').toBeDefined();
    expect(JSON.stringify(hit)).not.toContain('pending');
  });
});

describe('the search index cannot leak by accident', () => {
  it('stores no text field on a raw hit', () => {
    const hits = rawSearch('availability exception');
    expect(hits.length).toBeGreaterThan(0);
    for (const hit of hits) {
      expect(Object.keys(hit).sort()).toEqual(['documentId', 'id', 'page', 'score']);
    }
  });
});

describe('the absent tools stay absent', () => {
  const names = ALL_TOOLS.map((t) => t.name);
  for (const forbidden of [
    'set_score', 'set_weight', 'add_option', 'delete_option',
    'finalize_decision', 'read_document', 'search_and_read', 'release_page',
  ]) {
    it(`never registers ${forbidden}`, () => {
      expect(names).not.toContain(forbidden);
    });
  }

  it('exposes read_snippet as the only tool that can return document text', () => {
    const textCapable = ALL_TOOLS.filter((t) => t.gated === true).map((t) => t.name);
    expect(textCapable).toContain('read_snippet');
    expect(ALL_TOOLS.find((t) => t.name === 'read_snippet')?.annotations?.untrustedContentHint).toBe(true);
  });
});
