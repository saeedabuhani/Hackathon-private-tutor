"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/translations";

// Shows a hint that points to the material without giving the answer
export default function ActiveRecallHint({ hint, sourceReference, rtl }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  if (!hint) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-amber-400 hover:text-amber-300"
      >
        {t.needHint}
      </button>
    );
  }

  return (
    <div
      dir={rtl ? "rtl" : "ltr"}
      className="rounded-lg border border-amber-800 bg-amber-950/30 p-3 text-sm space-y-1"
    >
      <p className="text-amber-300 font-semibold">{t.hintTitle}</p>
      <p>{hint}</p>
      {sourceReference && (
        <p className="text-xs text-slate-500">
          {t.source} {sourceReference}
        </p>
      )}
    </div>
  );
}
