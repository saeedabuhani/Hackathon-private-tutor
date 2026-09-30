"use client";

import { useTranslation } from "@/lib/translations";

export default function LanguageBridge({ bridge, rtl }) {
  const { t } = useTranslation();
  if (!bridge?.original_term) return null;

  return (
    <div
      dir={rtl ? "rtl" : "ltr"}
      className="rounded-2xl border border-violet-400/25 bg-violet-500/10 p-3 text-sm space-y-1 shadow-[0_0_10px_rgba(139,92,246,0.07)]"
    >
      <p className="text-indigo-300 font-semibold">🌉 {t.languageBridge}</p>
      <p>
        <span className="text-slate-400">{t.originalTerm} </span>
        <code dir="ltr" className="bg-slate-800 px-1.5 py-0.5 rounded">
          {bridge.original_term}
        </code>
        {bridge.slide_ref && <span className="text-slate-500"> ({bridge.slide_ref})</span>}
      </p>
      {bridge.translation && (
        <p>
          <span className="text-slate-400">= </span>
          {bridge.translation}
        </p>
      )}
    </div>
  );
}
