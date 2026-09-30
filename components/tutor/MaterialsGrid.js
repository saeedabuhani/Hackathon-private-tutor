"use client";

import { parseDbDate } from "@/lib/dates";
import { useTranslation } from "@/lib/translations";

// "Your Materials": a 2-column grid of cards (1 column on very narrow screens). Clicking a
// card opens a chat about it; the 🗑️ button asks for confirmation (via onRequestDelete, a
// styled dialog owned by the parent — not the browser's own confirm()) before deleting it.
export default function MaterialsGrid({ materials, onSelect, onRequestDelete }) {
  const { t, locale } = useTranslation();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {materials.map((material) => (
        <div
          key={material.id}
          role="button"
          tabIndex={0}
          onClick={() => onSelect(material)}
          onKeyDown={(e) => e.key === "Enter" && onSelect(material)}
          className="group relative cursor-pointer rounded-3xl border border-slate-800 bg-slate-900 p-5 transition duration-300 hover:-translate-y-1 hover:border-indigo-600"
        >
          <button
            type="button"
            aria-label={t.deleteMaterialAria}
            title={t.delete}
            onClick={(e) => {
              e.stopPropagation();
              onRequestDelete(material);
            }}
            className="absolute end-2 top-2 rounded-md bg-red-500/15 px-2 py-1 text-sm text-red-400 transition hover:bg-red-500/30"
          >
            🗑️
          </button>

          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-500/30 to-blue-500/20 text-2xl shadow-[0_0_9px_rgba(139,92,246,0.14)]">📄</div>
          <p dir="auto" className="mb-1.5 truncate pe-8 text-sm font-semibold">
            {material.title}
          </p>

          <div className="flex flex-wrap gap-1">
            {(material.topics || []).slice(0, 3).map((topic) => (
              <span
                key={topic}
                dir="auto"
                className="rounded-full border border-violet-400/10 bg-violet-500/15 px-2.5 py-0.5 text-[11px] text-violet-200"
              >
                {topic}
              </span>
            ))}
          </div>

          <p className="mt-2 text-[11px] text-slate-500">
            {parseDbDate(material.created_at).toLocaleDateString(locale)}
          </p>
        </div>
      ))}
    </div>
  );
}
