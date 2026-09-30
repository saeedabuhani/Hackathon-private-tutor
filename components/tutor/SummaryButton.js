"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import MessageContent from "./MessageContent";
import Flag from "./Flag";
import { useTranslation } from "@/lib/translations";

// Language names are written in each language's own script on purpose (like the Feed tabs)
const LANGUAGES = [
  { code: "he", flag: "🇮🇱", country: "il", label: "עברית" },
  { code: "en", flag: "🇬🇧", country: "gb", label: "English" },
  { code: "ar", flag: "🇸🇦", country: "sa", label: "العربية" },
];
const FORMATS = [
  { code: "pdf", icon: "📄", label: "PDF" },
  { code: "word", icon: "📝", label: "Word" },
];

// Popup-only texts live here (not in lib/translations.js) so this feature stays self-contained
const TEXT = {
  en: {
    title: "Summarize this material",
    language: "Summary language",
    format: "Download format",
    go: "Summarize ✨",
    again: "↻ New summary",
    download: "Download",
    starting: "Your file is downloading…",
  },
  he: {
    title: "סיכום החומר",
    language: "שפת הסיכום",
    format: "פורמט להורדה",
    go: "סכם ✨",
    again: "↻ סיכום חדש",
    download: "הורד",
    starting: "הקובץ יורד…",
  },
  ar: {
    title: "تلخيص المادة",
    language: "لغة الملخص",
    format: "صيغة التنزيل",
    go: "لخّص ✨",
    again: "↻ ملخص جديد",
    download: "تنزيل",
    starting: "جارٍ تنزيل الملف…",
  },
};

// Neon trigger button: violet -> indigo with a soft glow
const triggerClass =
  "rounded-xl px-5 py-2.5 text-sm font-bold text-white transition hover:scale-[1.03] active:scale-[0.98] " +
  "bg-gradient-to-br from-violet-500/90 via-indigo-500/90 to-blue-500/90 " +
  "shadow-[0_0_11px_rgba(168,85,247,0.22)] hover:shadow-[0_0_15px_rgba(168,85,247,0.32)] " +
  "disabled:opacity-60";

function saveBase64(file) {
  const bytes = Uint8Array.from(atob(file.base64), (c) => c.charCodeAt(0));
  saveBlob(new Blob([bytes], { type: file.mime }), file.name);
}

function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export default function SummaryButton({ materialId, userId }) {
  const { t, lang: siteLang, dir } = useTranslation();
  const x = TEXT[siteLang] || TEXT.en;

  const [open, setOpen] = useState(false);
  // Portals to <body>: this button renders from inside an ancestor with `isolation: isolate`
  // (the Tutor stage), which would otherwise trap the popup's stacking below the page header,
  // whatever z-index it's given. Deferred to a mount effect since document.body doesn't exist
  // during server rendering.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [step, setStep] = useState("options"); // options | loading | result
  const [language, setLanguage] = useState(siteLang);
  const [format, setFormat] = useState("pdf");
  const [result, setResult] = useState(null); // { title, summary, language }
  const [exporting, setExporting] = useState("");
  const [error, setError] = useState("");
  const abortRef = useRef(null);

  // The "Summarize material" card in the Tools panel asks this button to open its popup
  const openRef = useRef(null);
  openRef.current = openPopup;
  useEffect(() => {
    const onRequest = () => openRef.current?.();
    window.addEventListener("tutor:summarize", onRequest);
    return () => window.removeEventListener("tutor:summarize", onRequest);
  }, []);

  // Escape closes the popup
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function openPopup() {
    setOpen(true);
    if (!result) {
      setStep("options");
      setLanguage(siteLang); // the site language may only have loaded after this button first rendered
    }
  }

  function close() {
    abortRef.current?.abort(); // a summary still being written is dropped
    setOpen(false);
    if (step === "loading") setStep("options");
  }

  async function post(body, signal) {
    const res = await fetch("/api/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ materialId, userId, ...body }),
      signal,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to generate summary");
    return data;
  }

  async function summarize() {
    const controller = new AbortController();
    abortRef.current = controller;
    setStep("loading");
    setError("");
    try {
      const data = await post({ language, format }, controller.signal);
      setResult({ title: data.title, summary: data.summary, language: data.language || language });
      setStep("result");
      if (data.file?.base64) saveBase64(data.file);
      else if (data.file?.error) setError(data.file.error);
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.message);
      setStep("options");
    }
  }

  // The summary is already on screen: export it again, no second AI call
  async function exportAs(fmt) {
    if (fmt === "md") {
      saveBlob(
        new Blob([`# ${result.title}\n\n${result.summary}`], { type: "text/markdown;charset=utf-8" }),
        `${result.title.replace(/[\\/:*?"<>|]+/g, "_")}-summary.md`
      );
      return;
    }
    setExporting(fmt);
    setError("");
    try {
      const data = await post({ language: result.language, format: fmt, markdown: result.summary });
      if (data.file?.base64) saveBase64(data.file);
      else setError(data.file?.error || "Export failed");
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting("");
    }
  }

  const loading = step === "loading";

  return (
    <>
      <button type="button" onClick={openPopup} className={triggerClass}>
        {loading ? t.summarizing : t.summarize}
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#03050F]/70 p-0 sm:p-6 backdrop-blur-md"
            onClick={close}
          >
            <motion.div
              dir={dir}
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, y: 28, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-lg max-h-[88vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-violet-500/40 bg-[#0a1024]/90 p-5 sm:p-6 shadow-[0_0_30px_rgba(139,92,246,0.14)] backdrop-blur-xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold bg-gradient-to-r from-violet-300 to-sky-300 bg-clip-text text-transparent">
                  {step === "result" ? t.summaryTitle : x.title}
                </h2>
                <button
                  onClick={close}
                  className="rounded-full p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                  aria-label={t.cancel}
                >
                  ✕
                </button>
              </div>

              {step === "options" && (
                <div className="space-y-5">
                  <section>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">{x.language}</p>
                    <div className="grid grid-cols-3 gap-2">
                      {LANGUAGES.map((l) => (
                        <ChoiceButton
                          key={l.code}
                          selected={language === l.code}
                          onClick={() => setLanguage(l.code)}
                        >
                          <Flag country={l.country} emoji={l.flag} />
                          <span>{l.label}</span>
                        </ChoiceButton>
                      ))}
                    </div>
                  </section>

                  <section>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">{x.format}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {FORMATS.map((f) => (
                        <ChoiceButton key={f.code} selected={format === f.code} onClick={() => setFormat(f.code)}>
                          <span className="text-xl">{f.icon}</span>
                          <span>{f.label}</span>
                        </ChoiceButton>
                      ))}
                    </div>
                  </section>

                  {error && <p className="text-sm text-red-400">{error}</p>}

                  <button
                    onClick={summarize}
                    className="w-full rounded-xl bg-gradient-to-r from-violet-500/90 via-indigo-500/90 to-blue-500/90 py-3 text-base font-bold text-white shadow-[0_0_12px_rgba(168,85,247,0.22)] transition hover:scale-[1.01] hover:shadow-[0_0_17px_rgba(168,85,247,0.34)] active:scale-[0.98]"
                  >
                    {x.go}
                  </button>
                </div>
              )}

              {loading && (
                <div className="flex flex-col items-center gap-4 py-10">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-500/10 border-t-violet-400 shadow-[0_0_12px_rgba(139,92,246,0.24)]" />
                  <p className="text-sm text-slate-300">{t.readingWhole}</p>
                </div>
              )}

              {step === "result" && result && (
                <div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <MessageContent content={result.summary} />
                  </div>
                  {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {FORMATS.map((f) => (
                      <button
                        key={f.code}
                        onClick={() => exportAs(f.code)}
                        disabled={Boolean(exporting)}
                        className="rounded-lg border border-violet-500/25 bg-violet-500/10 px-3.5 py-2 text-sm transition hover:bg-violet-500/25 disabled:opacity-50"
                      >
                        {exporting === f.code ? "…" : `${f.icon} ${x.download} ${f.label}`}
                      </button>
                    ))}
                    <button
                      onClick={() => exportAs("md")}
                      className="rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-sm transition hover:bg-white/10"
                    >
                      {t.downloadMd}
                    </button>
                    <button
                      onClick={() => {
                        setError("");
                        setStep("options");
                      }}
                      className="ms-auto rounded-lg px-3 py-2 text-sm text-slate-400 transition hover:text-white"
                    >
                      {x.again}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}

// A selectable chip. The chosen one is filled, glowing and slightly larger.
function ChoiceButton({ selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-sm font-medium transition ${
        selected
          ? "scale-[1.02] border-violet-400/60 bg-gradient-to-br from-violet-600/60 to-indigo-600/50 text-white shadow-[0_0_10px_rgba(139,92,246,0.22)]"
          : "border-white/10 bg-white/5 text-slate-300 hover:border-violet-500/30 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}
