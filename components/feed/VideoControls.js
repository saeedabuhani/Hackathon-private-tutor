"use client";

import { useEffect } from "react";
import { useTranslation } from "@/lib/translations";

export default function VideoControls({
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  watched,
  onMarkWatched,
  onSkip,
  xpReward,
}) {
  const { t } = useTranslation();

  // Keyboard: arrow up/down for prev/next
  useEffect(() => {
    function onKey(e) {
      if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;
      if (e.key === "ArrowUp" && hasPrev) onPrev();
      if (e.key === "ArrowDown" && hasNext) onNext();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onPrev, onNext, hasPrev, hasNext]);

  const btn =
    "rounded-full border border-white/10 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 px-4 py-2 text-sm";

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <button onClick={onPrev} disabled={!hasPrev} className={btn} aria-label={t.prevVideo}>
        ↑ {t.prevVideo}
      </button>
      <button
        onClick={onMarkWatched}
        disabled={watched}
        className="rounded-full bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 px-4 py-2 text-sm font-medium"
      >
        {watched ? t.watched : `+${xpReward} XP`}
      </button>
      <button onClick={onNext} disabled={!hasNext} className={btn} aria-label={t.nextVideo}>
        {t.nextVideo} ↓
      </button>
      <button
        onClick={onSkip}
        className="w-full text-xs text-slate-500 hover:text-slate-300"
      >
        {t.skipVideo}
      </button>
    </div>
  );
}
