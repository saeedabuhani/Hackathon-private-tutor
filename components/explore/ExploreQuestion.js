"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { detectLanguage } from "@/lib/utils";
import { useTranslation } from "@/lib/translations";

const LETTERS = ["A", "B", "C"];
const CORRECT_XP = 10; // matches CORRECT_XP in app/api/explore/answer/route.js

// Overlay quiz shown after a video. Calls onAnswer(isCorrect, optionText) once picked.
export default function ExploreQuestion({ quiz, onAnswer }) {
  const { t } = useTranslation();
  const [picked, setPicked] = useState(null);
  const rtl = ["he", "ar"].includes(detectLanguage(quiz.question));
  const options = [quiz.optionA, quiz.optionB, quiz.optionC];
  const answered = picked !== null;

  function pick(i) {
    if (answered) return;
    setPicked(i);
    const isCorrect = LETTERS[i] === quiz.correct;
    setTimeout(() => onAnswer(isCorrect, options[LETTERS.indexOf(quiz.correct)]), 700);
  }

  return (
    <div className="absolute inset-0 z-10 flex flex-col justify-center gap-3 bg-slate-950/95 p-4 overflow-auto">
      <p className="text-xs text-indigo-300">{t.quickQuestion}</p>
      <p dir={rtl ? "rtl" : "ltr"} className="font-semibold leading-snug">
        {quiz.question}
      </p>
      <div className="space-y-2" dir={rtl ? "rtl" : "ltr"}>
        {options.map((option, i) => {
          const isCorrectOption = LETTERS[i] === quiz.correct;
          const isPicked = picked === i;
          let style = "border border-white/10 bg-slate-800 hover:border-violet-400/40 hover:bg-slate-700";
          if (answered && isCorrectOption) style = "border border-emerald-400/70 bg-emerald-500/20 shadow-[0_0_9px_rgba(16,185,129,0.16)]";
          else if (answered && isPicked) style = "border border-rose-400/70 bg-rose-500/20 shadow-[0_0_9px_rgba(244,63,94,0.16)]";
          return (
            <button
              key={i}
              disabled={answered}
              onClick={() => pick(i)}
              className={`w-full rounded-xl px-3.5 py-2.5 text-sm text-start transition ${style}`}
            >
              <span className="text-slate-500 me-2">{LETTERS[i]}</span>
              {option}
            </button>
          );
        })}
      </div>
      {answered && (
        <motion.p
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center text-2xl"
        >
          {LETTERS[picked] === quiz.correct ? t.xpGain(CORRECT_XP) : "❌"}
        </motion.p>
      )}
    </div>
  );
}
