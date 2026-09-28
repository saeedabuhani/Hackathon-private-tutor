"use client";

import { detectLanguage } from "@/lib/utils";
import { useTranslation } from "@/lib/translations";

// Shown only after a wrong answer: a short AI explanation, then move on.
export default function ExploreExplain({ explanation, onContinue }) {
  const { t } = useTranslation();
  const rtl = ["he", "ar"].includes(detectLanguage(explanation));

  return (
    <div className="absolute inset-0 z-10 flex flex-col justify-center gap-4 bg-slate-950/95 p-4 text-center">
      <p className="text-3xl">❌</p>
      {explanation ? (
        <p dir={rtl ? "rtl" : "ltr"} className="text-sm text-slate-300 leading-relaxed">
          {explanation}
        </p>
      ) : (
        <p className="text-sm text-slate-500">{t.tryAnotherOnTopic}</p>
      )}
      <button
        onClick={onContinue}
        className="mx-auto rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 text-sm font-medium"
      >
        {t.showMeMore}
      </button>
    </div>
  );
}
