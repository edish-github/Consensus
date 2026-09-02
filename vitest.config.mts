import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

/**
 * Vitest needs the same `@/` alias the app uses, resolved to one absolute path.
 *
 * Without this, a tool importing '@/lib/store' and a test importing './lib/store'
 * end up as two module instances with two separate Zustand stores — the test
 * writes to one and the tool reads the other, which looks exactly like a bug in
 * the tool. It isn't. Cost me twenty minutes; leaving the note so it costs you none.
 */
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  test: { environment: 'node', include: ['evals/**/*.spec.ts'] },
});
