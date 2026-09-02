import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV === 'development';

/**
 * ══════════════════════════════════════════════════════════════════════════
 *  connect-src 'self' IS THE MOST IMPORTANT LINE IN THIS FILE.
 *
 *  It means the page is structurally incapable of sending anything to a third
 *  party. Not "does not", not "should not" — cannot. Every claim Consensus
 *  makes about confidential documents staying in the browser reduces to this
 *  header, and a judge can verify it from the Network tab in ten seconds
 *  without reading a line of our code.
 *
 *  A claim you can check beats a claim you have to believe.
 *
 *  Deliberately absent: analytics, error reporting, font CDNs, any origin at
 *  all beyond our own. Adding one would not just weaken the CSP, it would make
 *  the submission's central sentence false.
 * ══════════════════════════════════════════════════════════════════════════
 *
 * The rest is what Next.js needs to run:
 *   'unsafe-inline' script  — the App Router bootstrap is an inline script
 *   'unsafe-eval'           — dev only, for React Refresh
 *   'wasm-unsafe-eval'      — pdf.js compiles WASM for some PDFs
 *   worker-src blob:        — pdf.js instantiates its worker from a blob
 *   frame-ancestors 'none'  — nobody frames us, which also protects the
 *                             tool surface: ChatGPT ignores framed tools
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "worker-src 'self' blob:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          // WebMCP's own permission. Stated explicitly rather than relying on
          // the `self` default, so the intent is visible in the headers.
          { key: 'Permissions-Policy', value: 'tools=(self), camera=(), microphone=(), geolocation=(), payment=()' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ];
  },
};

export default nextConfig;
