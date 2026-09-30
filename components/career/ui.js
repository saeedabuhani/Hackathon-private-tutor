"use client";

import { useState } from "react";
import { authFetch } from "@/lib/authFetch";
import { useCareerText } from "./careerText";

// POST/GET to a career route with the signed-in user's token; throws an Error with the server's message
export async function careerFetch(url, body) {
  const res = await authFetch(url, body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {});
  let data = null;
  try {
    data = await res.json();
  } catch {
    // not JSON
  }
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data;
}

export function CopyButton({ text, label, className = "" }) {
  const { x } = useCareerText();
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    } catch {
      window.prompt(x.copy, text); // clipboard blocked: let the person copy by hand
    }
  }
  return (
    <button type="button" onClick={copy} className={`career-mini-btn ${className}`}>
      {done ? `✓ ${x.copied}` : label || x.copy}
    </button>
  );
}

// 0-100 bar; the fill grows from 0 the first time it is shown
export function ScoreBar({ score }) {
  const tone = score >= 75 ? "good" : score >= 50 ? "mid" : "low";
  return (
    <div className="score-track" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={score}>
      <div className={`score-bar tone-${tone}`} style={{ "--w": `${score}%` }} />
    </div>
  );
}

export function Spinner({ label }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-slate-400" role="status">
      <i className="career-spin" aria-hidden="true" />
      {label}
    </span>
  );
}

export function ErrorLine({ children }) {
  if (!children) return null;
  return (
    <p role="alert" className="career-error">
      {children}
    </p>
  );
}

// A code block in Markdown; a longer fence when the code itself contains ```
export function fenced(code, lang = "") {
  const ticks = code.includes("```") ? "````" : "```";
  return `${ticks}${lang.toLowerCase()}\n${code.trim()}\n${ticks}`;
}
