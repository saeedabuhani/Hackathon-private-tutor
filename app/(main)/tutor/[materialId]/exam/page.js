"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import useStore from "@/store/useStore";
import ExamCard from "@/components/tutor/ExamCard";
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

  async function generate() {
    if (!topic.trim()) return;
    setGenerating(true);
    setError("");
    setResult(null);
    setExam(null);
    try {
      setExam(await post("/api/exam", { materialId, topic: topic.trim(), userId: user.id }));
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
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
    <div className="max-w-3xl mx-auto p-6 space-y-6">
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
          className="flex-1 rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 outline-none focus:border-indigo-500"
        />
        <button
          onClick={generate}
          disabled={generating || !topic.trim()}
          className="rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 px-5 py-2 font-medium"
        >
          {generating ? t.writing : exam ? t.newQuestion : t.testMe}
        </button>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {exam && <ExamCard key={exam.question} exam={exam} onSubmit={check} loading={checking} result={result} />}
    </div>
  );
}
