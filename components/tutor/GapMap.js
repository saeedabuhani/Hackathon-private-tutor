"use client";

import { motion } from "framer-motion";
import { useTranslation } from "@/lib/translations";

function barColor(score) {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-rose-500";
}

export default function GapMap({ gaps }) {
  const { t } = useTranslation();

  if (!gaps?.length) {
    return <p className="text-slate-500 text-sm">{t.noGapData}</p>;
  }

  return (
    <ul className="space-y-4">
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
