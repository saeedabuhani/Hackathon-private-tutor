"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import MessageContent from "@/components/tutor/MessageContent";
import { DIFFICULTIES, CODE_LANGUAGES } from "@/lib/careerData";
import { useCareerText } from "./careerText";
import { careerFetch, ErrorLine, ScoreBar, Spinner, fenced } from "./ui";

// Coding challenge inside the app: the AI writes a challenge for your field, you write the code in a
// plain editor, and the AI reviews it (POST /api/career/challenge). A correct answer earns XP once.
// The review is the AI reading the code, not running it, and the screen says so.
export default function CodeChallenge({ profile, aiLang, onXp }) {
  const { x } = useCareerText();
  const firstLanguage = (profile.languages || []).find((l) => CODE_LANGUAGES.includes(l)) || "JavaScript";
  const [difficulty, setDifficulty] = useState("easy");
  const [language, setLanguage] = useState(firstLanguage);
  const [challenge, setChallenge] = useState(null); // { title, description, examples, hints, starterCode, difficulty, language, token }
  const [code, setCode] = useState("");
  const [phase, setPhase] = useState("idle"); // idle | making | coding | reviewing | result
  const [result, setResult] = useState(null);
  const [hintsShown, setHintsShown] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [solved, setSolved] = useState(0);
  const [error, setError] = useState("");
  const editorRef = useRef(null);

  const base = { role: profile.role, level: profile.level, lang: aiLang };

  async function makeChallenge() {
    setPhase("making");
    setError("");
    setResult(null);
    setShowSolution(false);
    setHintsShown(0);
    try {
      const data = await careerFetch("/api/career/challenge", { ...base, difficulty, language });
      setChallenge(data);
      setCode(data.starterCode || "");
      setPhase("coding");
    } catch (err) {
      setError(err.message);
      setPhase(challenge ? "coding" : "idle");
    }
  }

  async function check() {
    if (phase !== "coding" && phase !== "result") return;
    setPhase("reviewing");
    setError("");
    try {
      const { title, description, examples, difficulty: d, language: l, token } = challenge;
      const data = await careerFetch("/api/career/challenge", { ...base, challenge: { title, description, examples, difficulty: d, language: l, token }, userCode: code });
      setResult(data);
      setShowSolution(false);
      if (data.isCorrect) setSolved((n) => n + 1);
      if (typeof data.newTotal === "number") onXp?.(data.newTotal);
      setPhase("result");
    } catch (err) {
      setError(err.message);
      setPhase("coding");
    }
  }

  // Tab inserts two spaces (instead of leaving the editor); Ctrl/Cmd+Enter checks the code
  function onKeyDown(e) {
    if (e.key === "Tab") {
      e.preventDefault();
      const el = e.currentTarget;
      const { selectionStart: a, selectionEnd: b } = el;
      setCode(code.slice(0, a) + "  " + code.slice(b));
      requestAnimationFrame(() => el.setSelectionRange(a + 2, a + 2));
    } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      check();
    }
  }

  const busy = phase === "making" || phase === "reviewing";
  const verdictTone = result?.isCorrect ? "text-emerald-300" : result?.score >= 50 ? "text-amber-300" : "text-rose-300";

  return (
    <div className="space-y-4">
      <div className="career-card space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <p className="career-h">{x.difficultyLabel}</p>
            <div className="flex gap-2" role="group">
              {DIFFICULTIES.map((d) => (
                <button key={d} type="button" onClick={() => setDifficulty(d)} aria-pressed={difficulty === d} className={`career-chip ${difficulty === d ? "is-on" : ""}`}>
                  {x.difficulty[d]}
                </button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="career-h">{x.languageLabel}</span>
            <select dir="ltr" value={language} onChange={(e) => setLanguage(e.target.value)} className="career-input !w-auto">
              {CODE_LANGUAGES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={makeChallenge} disabled={busy} className="career-btn">
            {x.newChallenge}
          </button>
          {solved > 0 && <p className="pb-2 text-sm text-emerald-300">✅ {x.solved(solved)}</p>}
        </div>
        {phase === "making" && <Spinner label={x.makingChallenge} />}
        {phase === "idle" && !error && <p className="text-sm text-slate-400">{x.pickDifficulty}</p>}
        {phase === "idle" && <ErrorLine>{error}</ErrorLine>}
      </div>

      {challenge && phase !== "making" && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="career-card space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <h3 dir="auto" className="text-lg font-bold text-slate-100">
                {challenge.title}
              </h3>
              <span className="career-chip is-on" dir="ltr">
                {x.difficulty[challenge.difficulty]} · {challenge.language}
              </span>
            </div>
            <MessageContent content={challenge.description} />

            {challenge.examples.length > 0 && (
              <div>
                <p className="career-h">{x.examples}</p>
                <div className="grid gap-2 sm:grid-cols-2" dir="ltr">
                  {challenge.examples.map((e, i) => (
                    <div key={i} className="rounded-xl border border-white/10 bg-black/25 p-3 font-mono text-xs leading-6">
                      <div>
                        <span className="text-slate-500">{x.input}: </span>
                        <span className="text-slate-100">{e.input}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">{x.output}: </span>
                        <span className="text-emerald-300">{e.output}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {challenge.hints.length > 0 && (
              <div className="space-y-2">
                {challenge.hints.slice(0, hintsShown).map((h, i) => (
                  <p key={i} dir="auto" className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-200">
                    <b>{x.hintN(i + 1)}:</b> {h}
                  </p>
                ))}
                {hintsShown < challenge.hints.length && (
                  <button type="button" onClick={() => setHintsShown((n) => n + 1)} className="text-sm text-amber-300 hover:text-amber-200">
                    {x.showNextHint}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="career-card space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="career-h !mb-0">{x.yourCode}</p>
              <button type="button" onClick={() => setCode(challenge.starterCode || "")} className="career-mini-btn">
                {x.resetCode}
              </button>
            </div>
            <textarea
              ref={editorRef}
              className="code-editor"
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={onKeyDown}
              readOnly={phase === "reviewing"} /* readOnly, not disabled: a disabled box would drop the keyboard focus */
              aria-label={x.yourCode}
            />
            <p className="text-xs text-slate-500">
              {x.tabTip} {x.aiNote}
            </p>
            {phase !== "result" && <ErrorLine>{error}</ErrorLine>}
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={check} disabled={busy || code.trim().length < 5} className="career-btn">
                {x.checkCode}
              </button>
              {phase === "reviewing" && <Spinner label={x.reviewing} />}
            </div>
          </div>
        </motion.div>
      )}

      {phase === "result" && result && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="career-card career-verdict space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p dir="auto" className={`text-xl font-extrabold ${verdictTone}`}>
              {result.verdict}
            </p>
            {result.xpEarned > 0 && <span className="rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-sm font-bold text-amber-300">⭐ {x.xpEarned(result.xpEarned)}</span>}
          </div>
          {result.alreadySolved && <p className="text-sm text-slate-400">{x.alreadySolved}</p>}
          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <p className="career-h !mb-0">{x.score}</p>
              <p className="text-2xl font-extrabold text-slate-100" dir="ltr">
                {result.score}
                <span className="text-sm font-medium text-slate-500">/100</span>
              </p>
            </div>
            <ScoreBar score={result.score} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {result.goodParts.length > 0 && (
              <div>
                <p className="career-h">✅ {x.goodParts}</p>
                <ul dir="auto" className="career-list list-disc text-sm leading-7 text-slate-200">
                  {result.goodParts.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            {result.issues.length > 0 && (
              <div>
                <p className="career-h">🔧 {x.issues}</p>
                <ul dir="auto" className="career-list list-disc text-sm leading-7 text-slate-200">
                  {result.issues.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {result.optimalSolution && (
            <div className="space-y-3">
              <button type="button" onClick={() => setShowSolution((v) => !v)} className="career-btn is-quiet">
                {showSolution ? x.hideSolution : x.showSolution}
              </button>
              {showSolution && (
                <div className="space-y-3">
                  <MessageContent content={fenced(result.optimalSolution, challenge.language)} />
                  {result.explanation && (
                    <div>
                      <p className="career-h">💡 {x.explanation}</p>
                      <p dir="auto" className="text-sm leading-7 text-slate-200">
                        {result.explanation}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {!result.isCorrect && (
              <button type="button" onClick={() => setPhase("coding")} className="career-btn is-quiet">
                {x.tryAgain}
              </button>
            )}
            <button type="button" onClick={makeChallenge} className="career-btn">
              {x.nextChallenge}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
