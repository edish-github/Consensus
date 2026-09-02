/**
 * Copies the pdf.js worker into public/ so it is served same-origin.
 *
 * This matters for the CSP: worker-src can stay 'self' rather than allowing a
 * CDN, which keeps the "this page cannot talk to anywhere else" claim intact
 * and verifiable from the response headers.
 *
 * Wired to postinstall so a fresh clone works without a manual step.
 */
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);

try {
  const entry = require.resolve('pdfjs-dist/package.json');
  const pkgDir = dirname(entry);
  const candidates = [
    join(pkgDir, 'legacy', 'build', 'pdf.worker.min.mjs'),
    join(pkgDir, 'legacy', 'build', 'pdf.worker.mjs'),
    join(pkgDir, 'build', 'pdf.worker.min.mjs'),
    join(pkgDir, 'build', 'pdf.worker.mjs'),
  ];
  const src = candidates.find(existsSync);
  if (!src) throw new Error('pdf.worker not found in pdfjs-dist/legacy/build or build');

  mkdirSync('public', { recursive: true });
  copyFileSync(src, join('public', 'pdf.worker.min.mjs'));
  console.log('✓ pdf.worker.min.mjs copied to public/');
} catch (e) {
  console.warn('⚠ Could not copy pdf.js worker:', e.message);
  console.warn('  Run: cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/');
}
