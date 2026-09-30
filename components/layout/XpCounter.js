"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import useStore from "@/store/useStore";
import { useTranslation } from "@/lib/translations";

const COUNT_MS = 750;
const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);

// The XP pill in the header. When XP changes, the number counts up to the new total, the pill
// gives a small pop, and (for a real gain, not the first load) a "+N" floats out under it.
export default function XpCounter() {
  const { t } = useTranslation();
  const xp = useStore((s) => s.xp);
  const [shown, setShown] = useState(xp);
  const [pulse, setPulse] = useState(0);
  const [chips, setChips] = useState([]);
  const shownRef = useRef(xp);
  const prevRef = useRef(xp);
  const bornRef = useRef(0);
  const rafRef = useRef(0);
  const chipId = useRef(0);

  useEffect(() => {
    bornRef.current = performance.now();
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    const from = prevRef.current;
    if (from === xp) return;
    prevRef.current = xp;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const settled = performance.now() - bornRef.current > 2500;
    const start = shownRef.current;

    if (reduced) {
      shownRef.current = xp;
      setShown(xp);
      return;
    }
    if (xp > from && settled) {
      const id = ++chipId.current;
      setChips((c) => [...c, { id, text: `+${xp - from}` }]);
      setTimeout(() => setChips((c) => c.filter((x) => x.id !== id)), 1700);
      setPulse((p) => p + 1);
    }
    cancelAnimationFrame(rafRef.current);
    const t0 = performance.now();
    const tick = (now) => {
      const k = Math.min(1, (now - t0) / COUNT_MS);
      const v = Math.round(start + (xp - start) * easeOutCubic(k));
      if (v !== shownRef.current) {
        shownRef.current = v;
        setShown(v);
      }
      if (k < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [xp]);

  return (
    <span className="relative">
      <motion.span
        key={pulse}
        initial={pulse ? { scale: 1.16 } : false}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 420, damping: 16 }}
        className="xp-pill"
        aria-live="polite"
      >
        {t.xpPoints(shown)}
      </motion.span>
      <span className="pointer-events-none absolute inset-x-0 top-full flex justify-center" aria-hidden="true">
        <AnimatePresence>
          {chips.map((c) => (
            <motion.span
              key={c.id}
              initial={{ opacity: 0, y: -2, scale: 0.8 }}
              animate={{ opacity: 1, y: 10, scale: 1 }}
              exit={{ opacity: 0, y: 22 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute mt-1 whitespace-nowrap rounded-full border border-amber-300/40 bg-[#0a1024]/90 px-2 py-0.5 text-xs font-bold text-amber-300 shadow-lg"
            >
              {c.text} XP
            </motion.span>
          ))}
        </AnimatePresence>
      </span>
    </span>
  );
}
