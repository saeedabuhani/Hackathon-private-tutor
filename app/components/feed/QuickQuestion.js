"use client";

import { useEffect, useState } from "react";
import { detectLanguage } from "@/lib/utils";
import { useTranslation } from "@/lib/translations";

const LETTERS = ["a", "b", "c", "d"];

// Post-video multiple-choice question. Calls onDone(correct: boolean) when finished.
export default function QuickQuestion({ video, onDone }) {
  const { t } = useTranslation();
  const [quiz, setQuiz] = useState(null);
  const [error, setError] = useState("");
  const [picked, setPicked] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/feed/question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        videoTitle: video.title,
        videoDescription: video.description,
        lang: video.lang,
      }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not load question");
        if (!cancelled) setQuiz(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [video.id, video.title, video.description, video.lang]);

  const rtl = quiz ? ["he", "ar"].includes(detectLanguage(quiz.question)) : false;
  const answered = picked !== null;

  return (
    <div className="absolute inset-0 z-10 flex flex-col justify-center gap-3 bg-slate-950/95 p-4 overflow-auto">
      {error && (
        <>
          <p className="text-sm text-red-400">{error}</p>
          <button onClick={() => onDone(false)} className="rounded-lg bg-slate-800 px-4 py-2 text-sm">
            {t.skip}
          </button>
        </>
      )}
      {!error && !quiz && <p className="text-center text-slate-400">{t.preparingQuestion}</p>}
      {quiz && (
        <>
          <p className="text-xs text-indigo-300">{t.quickQuestion}</p>
          <p dir={rtl ? "rtl" : "ltr"} className="font-semibold leading-snug">
            {quiz.question}
          </p>
          <div className="space-y-2" dir={rtl ? "rtl" : "ltr"}>
            {quiz.options.map((option, i) => {
              const isCorrect = LETTERS[i] === quiz.correct;
              const isPicked = picked === i;
              let style = "border border-white/10 bg-slate-800 hover:border-violet-400/60 hover:bg-slate-700";
              if (answered && isCorrect) style = "border border-emerald-400/70 bg-emerald-500/20 shadow-[0_0_18px_rgba(16,185,129,0.4)]";
              else if (answered && isPicked) style = "border border-rose-400/70 bg-rose-500/20 shadow-[0_0_18px_rgba(244,63,94,0.4)]";
              return (
                <button
                  key={i}
                  disabled={answered}
                  onClick={() => setPicked(i)}
                  className={`w-full rounded-xl px-3.5 py-2.5 text-sm text-start transition ${style}`}
                >
                  {option}
                </button>
              );
            })}
          </div>
          {answered && (
            <button
              onClick={() => onDone(LETTERS[picked] === quiz.correct)}
              className="rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 text-sm font-medium"
            >
              {t.continue}
            </button>
          )}
        </>
      )}
    </div>
  );
}
