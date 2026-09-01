'use client';

import { useSyncExternalStore } from 'react';
import {
  subscribeRegistry,
  getRegisteredSnapshot,
  getRegisteredServerSnapshot,
} from '@/lib/webmcp/registry';
import {
  subscribeActivity,
  getActivitySnapshot,
  getActivityServerSnapshot,
  clearActivity,
} from '@/lib/webmcp/activity';

/**
 * Makes the agent legible to the human.
 *
 * Two panels: what is currently registered, and what has actually been called.
 * Both earn their place in the demo — the tool list mirrors what ChatGPT shows
 * in its own site-tools popover, and the call log is the only reliable way to
 * see whether the agent really called locate_evidence or merely said it did.
 */

const CLASS_LABEL: Record<'A' | 'B' | 'C', string> = {
  A: 'read',
  B: 'gated',
  C: 'write',
};

const CLASS_STYLE: Record<'A' | 'B' | 'C', string> = {
  A: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  B: 'bg-blue-100 text-blue-800 border-blue-300',
  C: 'bg-amber-100 text-amber-800 border-amber-300',
};

export function ToolSurfacePanel() {
  const tools = useSyncExternalStore(
    subscribeRegistry,
    getRegisteredSnapshot,
    getRegisteredServerSnapshot
  );
  const activity = useSyncExternalStore(
    subscribeActivity,
    getActivitySnapshot,
    getActivityServerSnapshot
  );

  const readCount = tools.filter((t) => t.readOnly).length;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="rounded-xl border border-neutral-200 bg-white p-4">
        <header className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-neutral-900">Registered tools</h2>
          <span className="text-xs text-neutral-500">
            {tools.length} total · {readCount} read · {tools.length - readCount} write
          </span>
        </header>

        {tools.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No tools registered. Open this page in the ChatGPT desktop browser, or in Chrome
            with <code className="rounded bg-neutral-100 px-1">chrome://flags/#enable-webmcp-testing</code>.
          </p>
        ) : (
          <ul className="space-y-2">
            {tools.map((t) => (
              <li key={t.name} className="rounded-lg border border-neutral-200 bg-neutral-50 p-2.5">
                <div className="flex items-center gap-2">
                  <code className="text-xs font-semibold text-neutral-900">{t.name}</code>
                  <span
                    className={`rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${CLASS_STYLE[t.klass]}`}
                  >
                    {CLASS_LABEL[t.klass]}
                  </span>
                  {t.gated && (
                    <span className="rounded border border-blue-300 bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-blue-800">
                      needs approval
                    </span>
                  )}
                </div>
                <p className="mt-1 line-clamp-2 text-xs leading-snug text-neutral-600">
                  {t.description}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-4">
        <header className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-neutral-900">Tool calls</h2>
          {activity.length > 0 && (
            <button
              type="button"
              onClick={clearActivity}
              className="text-xs text-neutral-500 underline underline-offset-2 hover:text-neutral-800"
            >
              clear
            </button>
          )}
        </header>

        {activity.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Nothing yet. Ask the agent: <em>&ldquo;What do my documents say about SOC 2
            availability exceptions?&rdquo;</em>
          </p>
        ) : (
          <ol className="space-y-1.5">
            {activity.map((c) => (
              <li
                key={c.id}
                className="flex items-center gap-2 rounded-lg bg-neutral-50 px-2.5 py-1.5 text-xs"
              >
                <span
                  aria-hidden
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    c.outcome === 'ok' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
                <code className="font-semibold text-neutral-900">{c.tool}</code>
                {c.code && <span className="text-amber-700">{c.code}</span>}
                <span className="ml-auto tabular-nums text-neutral-400">{c.durationMs}ms</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
