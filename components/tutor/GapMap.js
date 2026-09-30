"use client";

import { motion } from "framer-motion";
import { useTranslation } from "@/lib/translations";

function barColor(score) {
  if (score >= 70) return "bg-gradient-to-r from-emerald-500 to-teal-300 shadow-[0_0_6px_rgba(16,185,129,0.24)]";
  if (score >= 40) return "bg-gradient-to-r from-amber-500 to-yellow-300 shadow-[0_0_6px_rgba(245,158,11,0.22)]";
  return "bg-gradient-to-r from-rose-500 to-pink-400 shadow-[0_0_6px_rgba(244,63,94,0.22)]";
}

export default function GapMap({ gaps }) {
  const { t } = useTranslation();

  if (!gaps?.length) {
    return <p className="text-slate-500 text-sm">{t.noGapData}</p>;
  }

  return (
    <ul className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900 p-5">
      {gaps.map((g) => {
        const score = Math.round(g.score_avg || 0);
        const tested = g.attempts_count > 0;
        return (
          <li key={g.id}>
            <div className="flex justify-between gap-3 text-sm mb-1">
              <span dir="auto">{g.topic}</span>
              <span className="text-slate-400 text-end">
                {tested ? `${score}%` : t.notTested} · {t.stuckTimes(g.stuck_count)} ·{" "}
                {t.testedTimes(g.attempts_count)}
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${barColor(score)}`}
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 0.6 }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
