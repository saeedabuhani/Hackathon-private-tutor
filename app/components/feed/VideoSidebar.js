"use client";

import { detectLanguage } from "@/lib/utils";
import { useTranslation } from "@/lib/translations";

// A list of videos: thumbnail, title, and a small meta line. Shared by StudyFeed and AI Studies.
// Each video needs { id, title, thumbnail, channel, duration } (channel/duration may be empty).
export default function VideoSidebar({ videos, currentId, watchedIds, onSelect }) {
  const { t } = useTranslation();

  if (videos.length === 0) {
    return <p className="text-sm text-slate-500">{t.noVideosFoundLang}</p>;
  }

  return (
    <ul className="space-y-2">
      {videos.map((v) => {
        const active = v.id === currentId;
        const rtl = ["he", "ar"].includes(detectLanguage(v.title));
        const meta = [v.channel, v.duration].filter(Boolean).join(" · ");
        return (
          <li key={v.id}>
            <button
              onClick={() => onSelect(v.id)}
              className={`w-full flex gap-3 rounded-2xl p-2.5 text-start transition duration-200 hover:-translate-y-0.5 ${
                active
                  ? "bg-indigo-950 border border-indigo-600"
                  : "bg-slate-900 border border-slate-800 hover:border-violet-400/50 hover:bg-slate-800"
              }`}
            >
              {v.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={v.thumbnail} alt="" className="w-24 h-14 rounded-xl object-cover shrink-0" />
              ) : (
                <div className="w-24 h-14 rounded-xl bg-slate-800 shrink-0" />
              )}
              <div className="min-w-0" dir={rtl ? "rtl" : "ltr"}>
                <p className="text-sm line-clamp-2">{v.title}</p>
                <p className="text-xs text-slate-500 truncate">
                  {meta}
                  {watchedIds?.has(v.id) && " · ✅"}
                </p>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
