"use client";

import "./video-ui.css";
import { detectLanguage } from "@/lib/utils";
import { useTranslation } from "@/lib/translations";

// A list of videos: thumbnail, title, and a small meta line. Shared by StudyFeed and AI Studies.
// Each video needs { id, title, thumbnail, channel, duration } (channel/duration may be empty).
// `skin` dresses the cards for the sea around them: "shell" (reef stones and pearl) or "tank" (research
// glass). `look` lets a fish in the aquarium swim over and look at the card under the pointer.
export default function VideoSidebar({ videos, currentId, watchedIds, onSelect, skin = "", look = false }) {
  const { t } = useTranslation();

  function lookAt(e, on) {
    if (!look || !window.matchMedia("(hover: hover)").matches) return;
    const r = e.currentTarget.getBoundingClientRect();
    window.dispatchEvent(
      new CustomEvent("aquarium-look", { detail: { rect: on ? { left: r.left, right: r.right, top: r.top, width: r.width, height: r.height } : null } })
    );
  }

  if (videos.length === 0) {
    return <p className="text-sm text-slate-500">{t.noVideosFoundLang}</p>;
  }

  return (
    <ul className="vlist space-y-2">
      {videos.map((v, i) => {
        const active = v.id === currentId;
        const rtl = ["he", "ar"].includes(detectLanguage(v.title));
        const meta = [v.channel, v.duration].filter(Boolean).join(" · ");
        const watched = watchedIds?.has(v.id);
        return (
          <li key={v.id} style={{ "--i": Math.min(i, 8) }}>
            <button
              onClick={() => onSelect(v.id)}
              onPointerEnter={(e) => lookAt(e, true)}
              onPointerLeave={(e) => lookAt(e, false)}
              className={`vcard ${skin ? `vcard--${skin}` : ""} ${active ? "is-active" : ""}`}
              aria-current={active ? "true" : undefined}
            >
              <div className="vthumb">
                {v.thumbnail && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={v.thumbnail} alt="" loading="lazy" />
                )}
                <span className="vplay" aria-hidden="true">
                  <i>
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                      <path d="M8 5.5v13l11-6.5-11-6.5Z" />
                    </svg>
                  </i>
                </span>
                {active && (
                  <span className="veq" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </span>
                )}
                {watched && (
                  <span className="vwatched" aria-hidden="true">
                    ✓
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1" dir={rtl ? "rtl" : "ltr"}>
                <p className="text-sm font-medium leading-snug text-slate-100 line-clamp-2">{v.title}</p>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {meta}
                  {watched && " · ✅"}
                </p>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
