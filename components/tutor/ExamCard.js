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
    <section className="rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-4">
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
          className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 outline-none focus:border-indigo-500"
        />
        <div className="flex items-center justify-between">
          <ActiveRecallHint hint={exam.hint} sourceReference={exam.sourceReference} rtl={rtl} />
          <button
            type="submit"
            disabled={loading || !answer.trim()}
            className="rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 px-5 py-2 font-medium"
          >
            {loading ? t.checking : t.checkAnswer}
          </button>
        </div>
      </form>

      {result && (
        <div
          dir={rtl ? "rtl" : "ltr"}
          className={`rounded-lg border p-3 text-sm space-y-1 ${
            result.isCorrect
              ? "border-emerald-800 bg-emerald-950/30"
              : "border-rose-800 bg-rose-950/30"
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
