"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Flag from "./Flag";
import { useTranslation } from "@/lib/translations";

// Language names are written in each language's own script on purpose
export const TRANSLATE_LANGUAGES = [
  { code: "he", flag: "🇮🇱", country: "il", label: "עברית" },
  { code: "en", flag: "🇬🇧", country: "gb", label: "English" },
  { code: "ar", flag: "🇸🇦", country: "sa", label: "العربية" },
];

const LABEL = { en: "Translate", he: "תרגום", ar: "ترجمة" };

// "🌐 Translate ▾" dropdown. `value` is null (show the question as generated) or 'he' | 'en' | 'ar'.
// Once a language is picked the button shows it: "🌐 עברית ▾".
export default function TranslateMenu({ value, onChange, busy = false }) {
  const { lang: siteLang } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const current = TRANSLATE_LANGUAGES.find((l) => l.code === value);

  // Click outside or Escape closes the menu
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => !rootRef.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={busy}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex h-full items-center gap-2 whitespace-nowrap rounded-xl border px-4 py-2 text-sm font-medium transition disabled:opacity-60 ${
          current
            ? "border-violet-400/40 bg-violet-500/15 text-violet-100 shadow-[0_0_8px_rgba(139,92,246,0.14)]"
            : "border-slate-700 bg-slate-900/60 text-slate-200 hover:border-violet-400/30"
        }`}
      >
        <span>🌐</span>
        <span>{busy ? "…" : current ? current.label : LABEL[siteLang] || LABEL.en}</span>
        <span className={`text-xs transition ${open ? "rotate-180" : ""}`}>▾</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute end-0 top-full z-40 mt-2 min-w-[11rem] overflow-hidden rounded-2xl border border-violet-500/30 bg-[#0a1024]/95 p-1.5 shadow-[0_0_17px_rgba(139,92,246,0.14)] backdrop-blur-xl"
          >
            {TRANSLATE_LANGUAGES.map((l) => (
              <li key={l.code} role="option" aria-selected={value === l.code}>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onChange(l.code);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-start text-sm transition ${
                    value === l.code ? "bg-violet-500/25 text-white" : "text-slate-200 hover:bg-white/10"
                  }`}
                >
                  <Flag country={l.country} emoji={l.flag} />
                  <span className="flex-1">{l.label}</span>
                  {value === l.code && <span className="text-violet-300">✓</span>}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
