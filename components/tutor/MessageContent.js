"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { detectLanguage } from "@/lib/utils";
import { useTranslation } from "@/lib/translations";

const COPY_TEXT = {
  en: { copy: "Copy", copied: "Copied" },
  he: { copy: "העתק", copied: "הועתק" },
  ar: { copy: "نسخ", copied: "تم النسخ" },
};

// A code block: language label, a Copy button, line numbers and syntax highlighting.
// Code is always left-to-right, even inside Hebrew / Arabic text.
function CodeBlock({ language, code }) {
  const { lang } = useTranslation();
  const label = COPY_TEXT[lang] || COPY_TEXT.en;
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // clipboard blocked: nothing to do
    }
  }

  return (
    <div dir="ltr" className="code-block">
      <div className="code-block-bar">
        <span className="font-mono text-xs text-slate-400">{language}</span>
        <button type="button" onClick={copy} className="code-copy" aria-label={label.copy}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {copied ? <path d="m5 12.5 4.5 4.5L19 7.5" /> : <><rect x="8" y="8" width="12" height="12" rx="2.5" /><path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8" /></>}
          </svg>
          {copied ? label.copied : label.copy}
        </button>
      </div>
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={language}
        showLineNumbers
        lineNumberStyle={{ minWidth: "2.2em", color: "#5d6789", userSelect: "none" }}
        customStyle={{ margin: 0, padding: "0.85rem 1rem", background: "transparent", fontSize: "0.82rem", lineHeight: 1.65 }}
        codeTagProps={{ style: { fontFamily: "Consolas, 'JetBrains Mono', 'Courier New', monospace" } }}
        PreTag="div"
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

// Renders AI Markdown (summaries, chat answers) with dark styling and syntax-highlighted
// code blocks. Wrapped in dir="auto" so Hebrew/Arabic paragraphs align correctly.
export default function MessageContent({ content }) {
  const rtl = ["he", "ar"].includes(detectLanguage(content));

  return (
    <div dir={rtl ? "rtl" : "ltr"} className="prose-invert max-w-none">
      <ReactMarkdown
        components={{
          h1: (p) => <h1 className="text-neon text-xl font-extrabold mt-4 mb-2 first:mt-0" {...p} />,
          h2: (p) => <h2 className="text-base font-bold text-slate-100 mt-5 mb-2 first:mt-0" {...p} />,
          h3: (p) => <h3 className="text-sm font-semibold text-indigo-300 mt-4 mb-1" {...p} />,
          p: (p) => <p className="mb-3 text-[15px] leading-7 text-slate-200" {...p} />,
          ul: (p) => <ul className="mb-3 ms-5 list-disc space-y-1.5 text-[15px] leading-7 text-slate-200 marker:text-indigo-400" {...p} />,
          ol: (p) => <ol className="mb-3 ms-5 list-decimal space-y-1.5 text-[15px] leading-7 text-slate-200 marker:text-indigo-400" {...p} />,
          li: (p) => <li {...p} />,
          strong: (p) => <strong className="font-semibold text-slate-50" {...p} />,
          a: (p) => <a className="text-indigo-400 hover:underline" target="_blank" rel="noreferrer" {...p} />,
          code({ className, children, ...rest }) {
            const match = /language-(\w+)/.exec(className || "");
            const isBlock = Boolean(match) || String(children).includes("\n");
            if (!isBlock) {
              return (
                <code className="rounded-md bg-slate-800 px-1.5 py-0.5 text-[13px] text-indigo-200" dir="ltr" {...rest}>
                  {children}
                </code>
              );
            }
            return <CodeBlock language={match?.[1] || "text"} code={String(children).replace(/\n$/, "")} />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
