"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, Loader2, CreditCard, Book } from "lucide-react";
import { Button } from "@/components/ui/button";

// Very small markdown styling — uses Tailwind classes mapped per element.
// We can't easily use the Tailwind typography plugin in this sandboxed env,
// so we hand-style each element.

const components: React.ComponentProps<typeof ReactMarkdown>["components"] = {
  h1: ({ children }) => (
    <h1 className="text-3xl font-bold text-white tracking-tight mb-4 mt-2">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-xl font-bold text-white mt-8 mb-3 pb-2 border-b border-slate-800">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-base font-semibold text-cyan-300 mt-5 mb-2">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="text-sm text-slate-300 leading-relaxed my-3">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="text-sm text-slate-300 list-disc list-inside my-3 space-y-1">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="text-sm text-slate-300 list-decimal list-inside my-3 space-y-1">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
  em: ({ children }) => <em className="text-slate-200 italic">{children}</em>,
  code: ({ children }) => (
    <code className="bg-slate-900/80 text-cyan-300 px-1.5 py-0.5 rounded font-mono text-xs border border-slate-800">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 overflow-x-auto my-3">
      {children}
    </pre>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-cyan-400 hover:text-cyan-300 underline"
    >
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-4 rounded-lg border border-slate-800">
      <table className="w-full text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-slate-900/40 text-slate-400">{children}</thead>,
  th: ({ children }) => (
    <th className="px-4 py-2 text-left font-medium border-b border-slate-800">{children}</th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-2 text-slate-300 border-b border-slate-800/60">{children}</td>
  ),
  hr: () => <hr className="border-slate-800 my-6" />,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-cyan-500 bg-cyan-500/5 pl-4 py-2 my-3 text-sm text-slate-300 italic">
      {children}
    </blockquote>
  ),
};

export function StripeDocsView({ onBack }: { onBack: () => void }) {
  const [markdown, setMarkdown] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch("/api/docs/stripe", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = (await r.json()) as { markdown: string };
        setMarkdown(data.markdown);
      })
      .catch((e) => {
        console.error(e);
        setError((e as Error).message);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-violet-500/20 to-[#00f2fe]/20 flex items-center justify-center">
          <CreditCard className="w-6 h-6 text-cyan-300" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Book className="w-5 h-5 text-cyan-400" />
            Stripe integration docs
          </h1>
          <p className="text-xs text-slate-400">
            How to switch from the simulated payment provider to real Stripe.
          </p>
        </div>
      </div>

      <div className="glass-panel rounded-2xl border border-slate-800 p-6 sm:p-8 shadow-2xl">
        {loading ? (
          <div className="py-10 text-center text-slate-500 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading docs...
          </div>
        ) : error ? (
          <div className="py-10 text-center text-red-400">{error}</div>
        ) : markdown ? (
          <div className="prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
              {markdown}
            </ReactMarkdown>
          </div>
        ) : null}
      </div>

      <div className="text-center">
        <Button
          variant="outline"
          onClick={onBack}
          className="border-slate-700 text-slate-200 hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Button>
      </div>
    </div>
  );
}
