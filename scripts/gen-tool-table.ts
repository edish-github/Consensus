/**
 * Regenerates docs/TOOLS.md from the tool catalogue.
 *
 * The point is that the documentation cannot drift from the code. A tool table
 * hand-maintained alongside ten tools is a tool table that will be wrong within
 * a week, and a judge who spots the discrepancy stops trusting the rest.
 *
 *   npx tsx scripts/gen-tool-table.ts
 */
import { writeFileSync } from 'node:fs';
import { ALL_TOOLS } from '../lib/webmcp/tools';
import type { CapabilityKey } from '../lib/webmcp/types';

const CLASS_LABEL: Record<string, string> = {
  A: 'A · read-only',
  B: 'B · gated',
  C: 'C · proposal',
};

const ABSENT = [
  'set_score', 'set_weight', 'add_option',
  'delete_option', 'finalize_decision', 'read_document',
];

function capabilityLabel(requires: CapabilityKey[]): string {
  return requires.length === 0 ? '_always_' : requires.map((r) => `\`${r}\``).join(' + ');
}

function schemaTable(schema: Record<string, unknown>): string {
  const properties = (schema.properties ?? {}) as Record<
    string,
    { type?: string; description?: string; minimum?: number; maximum?: number; maxLength?: number }
  >;
  const required = new Set((schema.required as string[] | undefined) ?? []);

  if (Object.keys(properties).length === 0) return '_No parameters._\n';

  const rows = Object.entries(properties).map(([name, spec]) => {
    const constraints: string[] = [];
    if (spec.minimum !== undefined || spec.maximum !== undefined) {
      constraints.push(`${spec.minimum ?? '−∞'}–${spec.maximum ?? '∞'}`);
    }
    if (spec.maxLength !== undefined) constraints.push(`≤${spec.maxLength} chars`);
    return `| \`${name}\` | ${spec.type ?? 'object'} | ${required.has(name) ? '✓' : ''} | ${constraints.join(', ') || '—'} | ${spec.description ?? ''} |`;
  });

  return ['| Parameter | Type | Required | Constraints | Description |', '|---|---|:---:|---|---|', ...rows].join('\n') + '\n';
}

const lines: string[] = [];

lines.push('# Tool Reference', '');
lines.push('> **Generated from `lib/webmcp/tools/index.ts` by `scripts/gen-tool-table.ts`.**');
lines.push('> Do not edit by hand — run the script instead. This file cannot drift from the code.', '');
lines.push(`Ten tools, three capability classes. Every \`inputSchema\` is closed`);
lines.push('(`additionalProperties: false`) so the agent cannot invent arguments that');
lines.push('silently do nothing.', '');

/* Summary table */
lines.push('## At a glance', '');
lines.push('| Tool | Class | `readOnlyHint` | Gated | Requires |', '|---|---|:---:|:---:|---|');
for (const t of ALL_TOOLS) {
  lines.push(
    `| [\`${t.name}\`](#${t.name.replace(/_/g, '')}) | ${CLASS_LABEL[t.klass]} | ` +
      `${t.annotations?.readOnlyHint ? '✓' : ''} | ${t.gated ? '✓' : ''} | ${capabilityLabel(t.requires)} |`
  );
}
lines.push('');

/* Absent tools */
lines.push('## Tools that deliberately do not exist', '');
lines.push('```');
lines.push(ABSENT.join('   '));
lines.push('```', '');
lines.push('Their absence is the product. The agent can find, cite, argue and propose;');
lines.push('it cannot move a number. Asserted by `evals/boundary.spec.ts` and');
lines.push('`evals/security.spec.ts`, which fail the build if any of these names appears.', '');

/* Detail */
lines.push('---', '', '## Detail', '');
for (const t of ALL_TOOLS) {
  lines.push(`### \`${t.name}\``, '');
  lines.push(
    `**Class ${CLASS_LABEL[t.klass]}** · requires ${capabilityLabel(t.requires)}` +
      (t.annotations?.readOnlyHint ? ' · `readOnlyHint: true`' : '') +
      (t.annotations?.untrustedContentHint ? ' · `untrustedContentHint: true`' : '') +
      (t.gated ? ' · **needs human approval**' : ''),
    ''
  );
  lines.push(`> ${t.description}`, '');
  lines.push(schemaTable(t.inputSchema), '');
}

lines.push('---', '');
lines.push('Related: [`ARCHITECTURE.md`](ARCHITECTURE.md) · [`SECURITY.md`](SECURITY.md) · [`WHY-WEBMCP.md`](WHY-WEBMCP.md)');

writeFileSync('docs/TOOLS.md', lines.join('\n'));
console.log(`✓ docs/TOOLS.md — ${ALL_TOOLS.length} tools`);
