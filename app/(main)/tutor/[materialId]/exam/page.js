"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import useStore from "@/store/useStore";
import ExamCard from "@/components/tutor/ExamCard";
import TranslateMenu from "@/components/tutor/TranslateMenu";
import { useTranslation } from "@/lib/translations";

export default function ExamPage({ params }) {
  const { materialId } = params;
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const user = useStore((s) => s.user);
  const activeTopic = useStore((s) => s.activeTopic);

  const [topic, setTopic] = useState(searchParams.get("topic") || activeTopic || "");
  const [exam, setExam] = useState(null);
  const [result, setResult] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  // Translation of the question + hint. translateLang stays chosen for every new question.
  const [translateLang, setTranslateLang] = useState(null); // null | 'he' | 'ar' | 'en'
  const [translated, setTranslated] = useState(null); // { question, hint } for the current exam
  const [translating, setTranslating] = useState(false);
  const translateToken = useRef(0); // ignores a slow translation once the exam or language changed

  async function post(url, body) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  }

  function translateExam(examToTranslate, language) {
    return post("/api/exam/translate", {
      question: examToTranslate.question,
      hint: examToTranslate.hint,
      targetLanguage: language,
    });
  }

  async function generate() {
    if (!topic.trim()) return;
    const token = ++translateToken.current;
    setGenerating(true);
    setError("");
    setResult(null);
    setExam(null);
    setTranslated(null);
    try {
      const newExam = await post("/api/exam", { materialId, topic: topic.trim(), userId: user.id });
      // A language is already chosen: translate before showing, so the original never flashes
      let tr = null;
      if (translateLang) {
        try {
          tr = await translateExam(newExam, translateLang);
        } catch (err) {
          setError(err.message);
        }
      }
      if (token !== translateToken.current) return;
      setExam(newExam);
      setTranslated(tr);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  // Pick a language from the menu: translate the question on screen now (if any) and keep the
  // choice for the next questions
  async function pickLanguage(language) {
    setTranslateLang(language);
    if (!exam) return;
    const token = ++translateToken.current;
    setTranslating(true);
    setError("");
    try {
      const tr = await translateExam(exam, language);
      if (token === translateToken.current) setTranslated(tr);
    } catch (err) {
      if (token === translateToken.current) setError(err.message);
    } finally {
      if (token === translateToken.current) setTranslating(false);
    }
  }

  async function check(userAnswer) {
    setChecking(true);
    setError("");
    try {
      setResult(
        await post("/api/hint", {
          materialId,
          topic: topic.trim(),
          question: exam.question,
          userAnswer,
          userId: user.id,
        })
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="glass-panel space-y-6 p-6 sm:p-8">
      <div className="flex justify-between text-sm text-slate-400">
        <Link href={`/tutor/${materialId}`} className="hover:text-slate-100">
          {t.back}
        </Link>
        <Link href={`/tutor/${materialId}/report`} className="hover:text-slate-100">
          {t.gapMap}
        </Link>
      </div>

      <div className="flex gap-2">
        <input
          dir="auto"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && generate()}
          placeholder={t.topicPlaceholder}
          className="flex-1 rounded-xl bg-slate-900 border border-slate-700 px-4 py-2.5 outline-none focus:border-indigo-500"
        />
        <button
          onClick={generate}
          disabled={generating || !topic.trim()}
          className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 px-5 py-2 font-medium"
        >
          {generating ? t.writing : exam ? t.newQuestion : t.testMe}
        </button>
        <TranslateMenu value={translateLang} onChange={pickLanguage} busy={translating} />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {exam && (
        // key is the ORIGINAL question, so translating doesn't reset the typed answer
        <ExamCard
          key={exam.question}
          exam={translated ? { ...exam, question: translated.question, hint: translated.hint } : exam}
          onSubmit={check}
          loading={checking}
          result={result}
        />
      )}
    </div>
  );
}
