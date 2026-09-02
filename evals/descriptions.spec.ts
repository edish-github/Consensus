import { describe, it, expect } from 'vitest';
import { ALL_TOOLS } from '@/lib/webmcp/tools';

/**
 * Agent Experience lint.
 *
 * Chrome publishes soft budgets for WebMCP tool metadata — 500 characters per
 * tool description, 150 per parameter, 30 per name — and warns that
 * overlapping descriptions degrade the agent's ability to pick the right tool.
 * Both are recommendations, not enforced by the spec, which is exactly why
 * they need a test: nothing else will tell you when you drift past them.
 *
 * The overlap check is the one that has caught real problems. Two tools whose
 * descriptions share most of their distinctive vocabulary are two tools the
 * agent will confuse, and the failure mode is silent — it picks one, gets a
 * plausible result, and you never learn it chose wrong.
 */

const NAME_MAX = 30;
const DESCRIPTION_MAX = 500;
const PARAM_DESCRIPTION_MAX = 150;

/** Common words carry no signal about what a tool is for. */
const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'is', 'it', 'for', 'on',
  'this', 'that', 'with', 'you', 'your', 'not', 'no', 'only', 'can', 'cannot',
  'has', 'have', 'are', 'be', 'by', 'from', 'as', 'at', 'if', 'they', 'them',
  'user', 'users', 'call', 'calls', 'return', 'returns', 'use', 'used', 'do',
  'does', 'what', 'which', 'when', 'their', 'its', 'one', 'all', 'any', 'each',
]);

function distinctiveTerms(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9_\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w))
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  const intersection = [...a].filter((x) => b.has(x)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersection / union;
}

describe('tool metadata stays within Chrome budgets', () => {
  for (const tool of ALL_TOOLS) {
    it(`${tool.name} — name ≤ ${NAME_MAX}, description ≤ ${DESCRIPTION_MAX}`, () => {
      expect(tool.name.length, `name "${tool.name}"`).toBeLessThanOrEqual(NAME_MAX);
      expect(tool.description.length, `description for ${tool.name}`).toBeLessThanOrEqual(DESCRIPTION_MAX);
      expect(tool.description.length, `description for ${tool.name} is suspiciously short`).toBeGreaterThan(40);
    });

    it(`${tool.name} — every parameter description ≤ ${PARAM_DESCRIPTION_MAX}`, () => {
      const properties = (tool.inputSchema as { properties?: Record<string, { description?: string }> })
        .properties ?? {};
      for (const [param, schema] of Object.entries(properties)) {
        if (schema.description) {
          expect(
            schema.description.length,
            `${tool.name}.${param}`
          ).toBeLessThanOrEqual(PARAM_DESCRIPTION_MAX);
        }
      }
    });

    it(`${tool.name} — schema is closed and well-formed`, () => {
      const schema = tool.inputSchema as Record<string, unknown>;
      expect(schema.type).toBe('object');
      // additionalProperties: false keeps the agent from inventing arguments
      // that silently do nothing.
      expect(schema.additionalProperties).toBe(false);
    });
  }
});

describe('tool descriptions are distinguishable from one another', () => {
  const OVERLAP_MAX = 0.34;

  it('no two descriptions share more than the overlap threshold', () => {
    const offenders: string[] = [];

    for (let i = 0; i < ALL_TOOLS.length; i++) {
      for (let j = i + 1; j < ALL_TOOLS.length; j++) {
        const a = ALL_TOOLS[i]!;
        const b = ALL_TOOLS[j]!;
        const score = jaccard(distinctiveTerms(a.description), distinctiveTerms(b.description));
        if (score > OVERLAP_MAX) {
          offenders.push(`${a.name} ↔ ${b.name}: ${score.toFixed(2)}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});

describe('annotations match capability class', () => {
  it('every class A tool is marked readOnlyHint', () => {
    for (const tool of ALL_TOOLS.filter((t) => t.klass === 'A')) {
      expect(tool.annotations?.readOnlyHint, `${tool.name}`).toBe(true);
    }
  });

  it('no class B or C tool claims to be read-only', () => {
    for (const tool of ALL_TOOLS.filter((t) => t.klass !== 'A')) {
      expect(tool.annotations?.readOnlyHint, `${tool.name}`).not.toBe(true);
    }
  });

  it('every tool declares its required capabilities', () => {
    for (const tool of ALL_TOOLS) {
      expect(Array.isArray(tool.requires), `${tool.name}`).toBe(true);
    }
  });
});
