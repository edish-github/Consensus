/**
 * Text normalisation for extracted PDF pages.
 *
 * PDF text extraction produces artefacts that quietly wreck retrieval:
 * hyphens splitting words across line breaks, ligatures that do not match
 * typed queries, and whitespace that turns one word into two. A search for
 * "subprocessor" must match a document that rendered it as "sub-\nprocessor",
 * or the demo's central query returns nothing.
 */

const LIGATURES: Record<string, string> = {
  '\ufb00': 'ff', '\ufb01': 'fi', '\ufb02': 'fl', '\ufb03': 'ffi', '\ufb04': 'ffl',
  '\ufb05': 'st', '\ufb06': 'st',
};

export function normalise(raw: string): string {
  let text = raw;

  for (const [lig, replacement] of Object.entries(LIGATURES)) {
    text = text.split(lig).join(replacement);
  }

  // Curly quotes and dashes to ASCII, so a typed query matches a typeset page.
  text = text
    .replace(/[\u2018\u2019\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201F]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u00a0/g, ' ');

  // Repair hyphenation across a line break: "sub-\nprocessor" -> "subprocessor".
  text = text.replace(/([a-z])-\s*\n\s*([a-z])/g, '$1$2');

  // Collapse remaining newlines and runs of whitespace to single spaces.
  text = text.replace(/\s*\n\s*/g, ' ').replace(/[ \t]{2,}/g, ' ');

  return text.trim();
}

/** True when a page yielded no usable text — a scan, or a purely graphical page. */
export function isEmptyPage(text: string): boolean {
  return text.replace(/\s/g, '').length < 20;
}
