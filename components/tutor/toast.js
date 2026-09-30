"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

// Small global toast bus, the same shape as favorites.js's event pattern: any component calls
// notify(...), and the single <ToastHost/> mounted in the Tutor layout renders it. No provider
// or context wiring needed at each call site.
const EVENT = "tutor-toast";
let seq = 0;

// notify("Deleted "Arrays.pdf"") or notify({ message, tone: 'danger' | 'success' | 'info' })
export function notify(input) {
  const detail = typeof input === "string" ? { message: input, tone: "danger" } : { tone: "danger", ...input };
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { id: ++seq, ...detail } }));
}

const TONE = {
  danger: { icon: "🗑️", accent: "border-rose-400/30 bg-rose-500/12 text-rose-200", bar: "bg-rose-400" },
  success: { icon: "✓", accent: "border-emerald-400/30 bg-emerald-500/12 text-emerald-200", bar: "bg-emerald-400" },
  info: { icon: "ℹ️", accent: "border-violet-400/30 bg-violet-500/12 text-violet-200", bar: "bg-violet-400" },
};
const DURATION = 3600;

export default function ToastHost() {
  const [toasts, setToasts] = useState([]);
  // Portals to <body>: an ancestor with `isolation: isolate` (or a transform/filter) would
  // otherwise trap this element's stacking context, no matter how high its z-index is. Deferred
  // to a mount effect because document.body doesn't exist during server rendering.
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function onToast(e) {
      const toast = e.detail;
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== toast.id)), DURATION);
    }
    window.addEventListener(EVENT, onToast);
    return () => window.removeEventListener(EVENT, onToast);
  }, []);

  function dismiss(id) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  if (!mounted) return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[70] flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {toasts.map((toast) => {
          const tone = TONE[toast.tone] || TONE.danger;
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: -16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="pointer-events-auto relative flex w-full max-w-sm items-center gap-3 overflow-hidden rounded-2xl border border-white/10 bg-[#0a1024]/90 py-3 ps-3.5 pe-3 shadow-xl backdrop-blur-xl"
            >
              <span className={`absolute inset-y-0 start-0 w-1 ${tone.bar}`} aria-hidden="true" />
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-sm ${tone.accent}`} aria-hidden="true">
                {tone.icon}
              </span>
              <p dir="auto" className="min-w-0 flex-1 truncate text-sm text-slate-100">
                {toast.message}
              </p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss"
                className="shrink-0 rounded-md p-1 text-slate-500 transition hover:bg-white/10 hover:text-slate-200"
              >
                ✕
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>,
    document.body
  );
}
