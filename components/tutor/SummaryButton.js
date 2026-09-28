"use client";

import { useState } from "react";
import MessageContent from "./MessageContent";
import { useTranslation } from "@/lib/translations";

// Orange gradient per the spec — deliberately different from the app's indigo palette
// so it stands out as the "impressive for judges" action.
const buttonStyle = {
  background: "linear-gradient(135deg, #ff6b35, #f7c59f)",
  color: "#fff",
  fontWeight: 700,
  padding: "12px 24px",
  borderRadius: "12px",
  border: "none",
  cursor: "pointer",
  fontSize: "16px",
  boxShadow: "0 4px 15px rgba(255,107,53,0.4)",
};

export default function SummaryButton({ materialId, userId }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    setOpen(true);
    if (summary || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materialId, userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate summary");
      setSummary(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function download() {
    const blob = new Blob([`# ${summary.title}\n\n${summary.summary}`], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${summary.title.replace(/[^\w\-]+/g, "_")}-summary.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <button type="button" onClick={handleClick} disabled={loading} style={buttonStyle}>
        {loading ? t.summarizing : t.summarize}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-30 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-6"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-2xl max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-slate-900 border border-slate-800 p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">{t.summaryTitle}</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-100"
                aria-label={t.cancel}
              >
                ✕
              </button>
            </div>

            {loading && <p className="text-slate-400 text-sm">{t.readingWhole}</p>}
            {error && <p className="text-red-400 text-sm">{error}</p>}
            {summary && (
              <>
                <MessageContent content={summary.summary} />
                <button
                  onClick={download}
                  className="mt-3 rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2 text-sm"
                >
                  {t.downloadMd}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
