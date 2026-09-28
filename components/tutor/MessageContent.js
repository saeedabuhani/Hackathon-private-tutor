"use client";

import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { detectLanguage } from "@/lib/utils";

// Renders AI Markdown (summaries, chat answers) with dark styling and syntax-highlighted
// code blocks. Wrapped in dir="auto" so Hebrew/Arabic paragraphs align correctly.
export default function MessageContent({ content }) {
  const rtl = ["he", "ar"].includes(detectLanguage(content));

  return (
    <div dir={rtl ? "rtl" : "ltr"} className="prose-invert max-w-none leading-relaxed">
      <ReactMarkdown
        components={{
          h1: (p) => <h1 className="text-lg font-bold mt-4 mb-2 first:mt-0" {...p} />,
          h2: (p) => <h2 className="text-base font-bold mt-4 mb-2 first:mt-0" {...p} />,
          h3: (p) => <h3 className="text-sm font-semibold text-indigo-300 mt-3 mb-1" {...p} />,
          p: (p) => <p className="mb-3 text-sm" {...p} />,
          ul: (p) => <ul className="mb-3 ms-5 list-disc space-y-1 text-sm" {...p} />,
          ol: (p) => <ol className="mb-3 ms-5 list-decimal space-y-1 text-sm" {...p} />,
          li: (p) => <li {...p} />,
          strong: (p) => <strong className="font-semibold text-slate-100" {...p} />,
          a: (p) => <a className="text-indigo-400 hover:underline" target="_blank" rel="noreferrer" {...p} />,
          code({ className, children, ...rest }) {
            const match = /language-(\w+)/.exec(className || "");
            const isBlock = Boolean(match) || String(children).includes("\n");
            if (!isBlock) {
              return (
                <code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs" dir="ltr" {...rest}>
                  {children}
                </code>
              );
            }
            return (
              <SyntaxHighlighter
                style={vscDarkPlus}
                language={match?.[1] || "text"}
                customStyle={{ borderRadius: "0.5rem", fontSize: "0.8rem", margin: "0.75rem 0" }}
                PreTag="div"
              >
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
