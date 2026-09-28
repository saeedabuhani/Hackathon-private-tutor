"use client";

import { useTranslation } from "@/lib/translations";

export default function LanguageBridge({ bridge, rtl }) {
  const { t } = useTranslation();
  if (!bridge?.original_term) return null;

  return (
    <div
      dir={rtl ? "rtl" : "ltr"}
      className="rounded-lg border border-indigo-800 bg-indigo-950/40 p-3 text-sm space-y-1"
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
