"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import MessageContent from "@/components/tutor/MessageContent";
import { QUESTION_TYPES } from "@/lib/careerData";
import { useCareerText } from "./careerText";
import { careerFetch, ErrorLine, ScoreBar, Spinner } from "./ui";

const TYPE_KEY = { behavioral: "typeBehavioral", technical: "typeTechnical", code: "typeCode" };

// Practice interviews: the AI asks one question (behavioral, technical or a code review), you write
// your answer, and it scores it, points out what worked and what to improve, and shows a stronger
// answer. Every answered question is saved (POST /api/career/interview) and ends up in the PDF.
export default function InterviewPrep({ profile, aiLang }) {
  const { x } = useCareerText();
  const [type, setType] = useState("behavioral");
  const [phase, setPhase] = useState("idle"); // idle | asking | answering | evaluating | result
  const [q, setQ] = useState(null); // { question, hint, expectedKeywords }
  const [showHint, setShowHint] = useState(false);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]); // this visit: [{ type, score }]

  const base = { role: profile.role, level: profile.level, lang: aiLang };

  function pickType(next) {
    if (next === type) return;
    setType(next);
    setPhase("idle");
    setQ(null);
    setFeedback(null);
    setError("");
  }

  async function ask() {
    setPhase("asking");
    setError("");
    setFeedback(null);
    setAnswer("");
    setShowHint(false);
    try {
      const data = await careerFetch("/api/career/interview", { ...base, questionType: type });
      setQ(data);
      setPhase("answering");
    } catch (err) {
      setError(err.message);
      setPhase(q ? "answering" : "idle");
    }
  }

  async function submit() {
    if (answer.trim().length < 10) {
      setError(x.tooShort);
      return;
    }
    setPhase("evaluating");
    setError("");
    try {
      const data = await careerFetch("/api/career/interview", { ...base, questionType: type, question: q.question, userAnswer: answer });
      setFeedback(data);
      setHistory((h) => [...h, { type, score: data.score }]);
      setPhase("result");
    } catch (err) {
      setError(err.message);
      setPhase("answering");
    }
  }

  const avg = history.length ? Math.round(history.reduce((n, h) => n + h.score, 0) / history.length) : null;
  const answered = answer.toLowerCase();

  return (
    <div className="space-y-4">
      <div className="career-card space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2" role="group">
            {QUESTION_TYPES.map((t) => (
              <button key={t} type="button" onClick={() => pickType(t)} aria-pressed={type === t} className={`career-chip ${type === t ? "is-on" : ""}`}>
                {x[TYPE_KEY[t]]}
              </button>
            ))}
          </div>
          {avg !== null && (
            <p className="text-sm text-slate-400" dir="auto">
              {x.thisSession}: {history.length} · {x.average} <b className="text-slate-100">{avg}</b>
            </p>
          )}
        </div>
        <p className="text-sm text-slate-400">{x.typeHelp[type]}</p>
        {phase === "idle" && (
          <button type="button" onClick={ask} className="career-btn">
            {x.askMe}
          </button>
        )}
        {phase === "asking" && <Spinner label={x.asking} />}
      </div>

      {q && phase !== "asking" && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="career-card space-y-4">
          <MessageContent content={q.question} />
          {q.hint && phase === "answering" && (
            <div>
              {showHint ? (
                <p dir="auto" className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-200">
                  <b>{x.hintLabel}:</b> {q.hint}
                </p>
              ) : (
                <button type="button" onClick={() => setShowHint(true)} className="text-sm text-amber-300 hover:text-amber-200">
                  {x.showHint}
                </button>
              )}
            </div>
          )}

          {(phase === "answering" || phase === "evaluating") && (
            <>
              <textarea
                dir="auto"
                rows={6}
                value={answer}
                disabled={phase === "evaluating"}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder={x.answerPlaceholder}
                className="career-input resize-y leading-7"
              />
              <ErrorLine>{error}</ErrorLine>
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" onClick={submit} disabled={phase === "evaluating" || !answer.trim()} className="career-btn">
                  {x.checkAnswer}
                </button>
                {phase === "evaluating" && <Spinner label={x.evaluating} />}
              </div>
            </>
          )}
        </motion.div>
      )}
      {phase === "idle" && <ErrorLine>{error}</ErrorLine>}

      {phase === "result" && feedback && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="career-card career-verdict space-y-5">
          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <p className="career-h !mb-0">{x.score}</p>
              <p className="text-2xl font-extrabold text-slate-100" dir="ltr">
                {feedback.score}
                <span className="text-sm font-medium text-slate-500">/100</span>
              </p>
            </div>
            <ScoreBar score={feedback.score} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="career-h">✅ {x.strengths}</p>
              <ul dir="auto" className="career-list list-disc text-sm leading-7 text-slate-200">
                {feedback.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="career-h">🔧 {x.improvements}</p>
              <ul dir="auto" className="career-list list-disc text-sm leading-7 text-slate-200">
                {feedback.improvements.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          </div>

          {q?.expectedKeywords?.length > 0 && (
            <div>
              <p className="career-h">🔑 {x.keywords}</p>
              <div className="flex flex-wrap gap-2" dir="auto">
                {q.expectedKeywords.map((k) => (
                  <span key={k} className={`career-chip ${answered.includes(k.toLowerCase()) ? "is-on" : "is-ghost"}`}>
                    {answered.includes(k.toLowerCase()) ? "✓ " : ""}
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="career-h">💡 {x.improvedAnswer}</p>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
              <MessageContent content={feedback.improvedAnswer} />
            </div>
          </div>
          {feedback.tip && (
            <p dir="auto" className="rounded-xl border border-indigo-400/25 bg-indigo-400/10 p-3 text-sm text-indigo-100">
              🎯 <b>{x.tipLabel}:</b> {feedback.tip}
            </p>
          )}
          <button type="button" onClick={ask} className="career-btn">
            {x.nextQuestion}
          </button>
        </motion.div>
      )}
    </div>
  );
}
