"use client";

import { motion } from "framer-motion";
import { useTranslation } from "@/lib/translations";

export default function FeedSyncBanner({ topic, onDismiss }) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between gap-3 rounded-2xl border border-violet-400/25 bg-violet-500/10 px-4 py-2.5 text-sm shadow-[0_0_11px_rgba(139,92,246,0.08)]"
    >
      <span>
        🔗 {t.feedUpdated} <bdi className="font-bold">{topic}</bdi>
      </span>
      <button
        onClick={onDismiss}
        className="text-slate-400 hover:text-slate-100"
        aria-label={t.dismiss}
      >
        ✕
      </button>
    </motion.div>
  );
}
