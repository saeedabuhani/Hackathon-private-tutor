"use client";

import { useState } from "react";
import { detectLanguage } from "@/lib/utils";
import { useTranslation } from "@/lib/translations";
import ActiveRecallHint from "./ActiveRecallHint";

export default function ExamCard({ exam, onSubmit, loading, result }) {
  const { t } = useTranslation();
  const [answer, setAnswer] = useState("");
  const rtl = ["he", "ar"].includes(detectLanguage(exam.question));

  function handleSubmit(e) {
    e.preventDefault();
    if (!answer.trim() || loading) return;
    onSubmit(answer.trim());
  }

  return (
    <section className="neon-panel rounded-3xl bg-slate-900 p-5 space-y-4">
      <p dir={rtl ? "rtl" : "ltr"} className="text-lg leading-relaxed">
        {exam.question}
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          dir={rtl ? "rtl" : "ltr"}
          rows={4}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder={t.yourAnswer}
          className="w-full rounded-2xl bg-slate-950 border border-slate-700 px-4 py-2.5 outline-none focus:border-indigo-500"
        />
        <div className="flex items-center justify-between">
          <ActiveRecallHint hint={exam.hint} sourceReference={exam.sourceReference} rtl={rtl} />
          <button
            type="submit"
            disabled={loading || !answer.trim()}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 px-5 py-2 font-medium"
          >
            {loading ? t.checking : t.checkAnswer}
          </button>
        </div>
      </form>

      {result && (
        <div
          dir={rtl ? "rtl" : "ltr"}
          className={`rounded-2xl border p-4 text-sm space-y-1 ${
            result.isCorrect
              ? "border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_11px_rgba(16,185,129,0.09)]"
              : "border-rose-500/50 bg-rose-500/10 shadow-[0_0_11px_rgba(244,63,94,0.09)]"
          }`}
        >
          <p className="font-semibold">
            {result.isCorrect ? t.correct : t.notQuite} · {Math.round(result.score)}/100
          </p>
          <p>{result.feedback}</p>
        </div>
      )}
    </section>
  );
}
