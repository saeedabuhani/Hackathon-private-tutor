"use client";

import { parseDbDate } from "@/lib/dates";
import { useTranslation } from "@/lib/translations";

// "Your Materials": a 2-column grid of cards (1 column on very narrow screens). Clicking a
// card opens a chat about it; the 🗑️ button asks for confirmation, then deletes it.
export default function MaterialsGrid({ materials, onSelect, onDelete }) {
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
          className="group relative cursor-pointer rounded-2xl border border-slate-800 bg-slate-900 p-4 transition-colors hover:border-indigo-600"
        >
          <button
            type="button"
            aria-label={t.deleteMaterialAria}
            title={t.delete}
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(t.confirmDeleteMaterial)) {
                onDelete(material.id);
              }
            }}
            className="absolute end-2 top-2 rounded-md bg-red-500/15 px-2 py-1 text-sm text-red-400 hover:bg-red-500/30"
          >
            🗑️
          </button>

          <div className="mb-2 text-3xl">📄</div>
          <p dir="auto" className="mb-1.5 truncate pe-8 text-sm font-semibold">
            {material.title}
          </p>

          <div className="flex flex-wrap gap-1">
            {(material.topics || []).slice(0, 3).map((topic) => (
              <span
                key={topic}
                dir="auto"
                className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-[11px] text-indigo-300"
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
