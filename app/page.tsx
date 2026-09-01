import Link from 'next/link';

export default function Landing() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16">
      <h1 className="text-4xl font-semibold tracking-tight text-neutral-900">Consensus</h1>
      <p className="mt-3 text-lg text-neutral-700">
        Your agent can find what it cannot read.
      </p>
      <p className="mt-4 max-w-prose text-sm leading-relaxed text-neutral-600">
        A decision workspace for choices that run on confidential documents. Drop the PDFs in;
        they are parsed in your browser and never uploaded. Your agent can search them and tell
        you where the answers are, but it cannot read a page without your explicit release.
      </p>

      <Link
        href="/d/demo"
        className="mt-8 inline-flex w-fit items-center rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700"
      >
        Open workspace
      </Link>

      <p className="mt-6 text-xs text-neutral-500">
        Best viewed in the ChatGPT desktop browser, or Chrome 146+ with{' '}
        <code className="rounded bg-neutral-100 px-1">chrome://flags/#enable-webmcp-testing</code>.
      </p>
    </main>
  );
}
