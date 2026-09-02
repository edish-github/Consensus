/**
 * Counts resources this page has actually loaded from another origin.
 *
 * Honest framing matters here: this measures what HAS happened, not what
 * COULD. The structural guarantee is the CSP — connect-src 'self' — and this
 * is the observable consequence of it, surfaced so the claim is checkable
 * without opening DevTools.
 */
export function crossOriginRequestCount(): number {
  if (typeof performance === 'undefined' || typeof location === 'undefined') return 0;
  const origin = location.origin;
  return performance.getEntriesByType('resource').filter((entry) => {
    try {
      return new URL((entry as PerformanceResourceTiming).name).origin !== origin;
    } catch {
      return false;
    }
  }).length;
}
