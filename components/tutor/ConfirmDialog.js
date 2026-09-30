"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "@/lib/translations";

// A glass confirm modal, styled like the rest of the Tutor (replaces window.confirm, which looks
// like a browser alert and can't be styled). `danger` tints the confirm button and the icon red.
export default function ConfirmDialog({ open, title, message, danger = true, busy = false, onConfirm, onCancel }) {
  const { t, dir } = useTranslation();
  // Portals to <body>: some callers render this from inside an ancestor with
  // `isolation: isolate` (or a transform/filter), which would otherwise trap the overlay's
  // stacking below the page header, whatever z-index it's given. Deferred to a mount effect
  // because document.body doesn't exist during server rendering.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#03050f]/70 p-4 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            dir={dir}
            role="alertdialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-panel w-full max-w-sm rounded-2xl p-5"
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-lg ${
                  danger
                    ? "border-rose-400/30 bg-rose-500/12 text-rose-300"
                    : "border-violet-400/30 bg-violet-500/12 text-violet-300"
                }`}
                aria-hidden="true"
              >
                {danger ? "🗑️" : "❓"}
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <h2 className="text-[15px] font-semibold text-slate-100">{title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-400">{message}</p>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={busy}
                className="rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10 disabled:opacity-50"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={busy}
                className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60 ${
                  danger
                    ? "bg-gradient-to-r from-rose-600 to-red-500 hover:brightness-110"
                    : "bg-indigo-600 hover:bg-indigo-500"
                }`}
              >
                {busy ? "…" : t.delete}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
