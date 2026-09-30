"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SummaryButton from "./SummaryButton";
import useFavorites, { materialKey, sessionKey } from "./favorites";
import { useTutorText } from "./tutorText";
import { useTranslation } from "@/lib/translations";

const ICON = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };

// Top of the central Tutor panel: who you are talking to, which material, and the small
// actions (bookmark, share, more, summarize).
export default function TutorPanelHeader({ materialId, material, sessionId, userId }) {
  const router = useRouter();
  const { t } = useTranslation();
  const { x } = useTutorText();
  const { toggle, isFavorite } = useFavorites();
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Bookmark the open conversation, or the material when no conversation exists yet
  const favKey = sessionId ? sessionKey(sessionId) : materialKey(materialId);
  const starred = isFavorite(favKey);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e) => !menuRef.current?.contains(e.target) && setMenuOpen(false);
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt(x.share, window.location.href); // clipboard blocked: let the user copy it
    }
  }

  const iconBtn =
    "flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/10 hover:text-white";

  return (
    <header className="tutor-panel-header">
      <div className="flex items-center gap-3">
        <div className="tutor-avatar" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M12 2.5 14 9l6.5 2L14 13l-2 6.5L10 13 3.5 11 10 9l2-6.5Z" />
            <path d="M19 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" opacity=".7" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-[17px] font-bold leading-tight text-slate-100">{x.tutorName}</h1>
          <p className="truncate text-xs text-slate-400">{x.tutorSub}</p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button type="button" onClick={() => toggle(favKey)} aria-pressed={starred} title={starred ? x.bookmarked : x.bookmark} aria-label={starred ? x.bookmarked : x.bookmark} className={`${iconBtn} ${starred ? "!border-amber-300/40 !bg-amber-300/10 !text-amber-300" : ""}`}>
            <svg {...ICON} fill={starred ? "currentColor" : "none"}>
              <path d="M6 3.5h12v17l-6-4-6 4v-17Z" />
            </svg>
          </button>
          <div className="relative">
            <button type="button" onClick={share} title={x.share} aria-label={x.share} className={iconBtn}>
              <svg {...ICON}>
                <circle cx="6" cy="12" r="2.3" />
                <circle cx="18" cy="6" r="2.3" />
                <circle cx="18" cy="18" r="2.3" />
                <path d="m8.1 10.9 7.8-3.8M8.1 13.1l7.8 3.8" />
              </svg>
            </button>
            {copied && (
              <span role="status" className="absolute end-0 top-11 z-20 whitespace-nowrap rounded-lg border border-white/10 bg-[#0a1024] px-2.5 py-1 text-xs text-slate-200 shadow-lg">
                ✓ {x.linkCopied}
              </span>
            )}
          </div>
          <div ref={menuRef} className="relative">
            <button type="button" onClick={() => setMenuOpen((o) => !o)} aria-haspopup="menu" aria-expanded={menuOpen} title={x.more} aria-label={x.more} className={iconBtn}>
              <svg {...ICON}>
                <circle cx="5" cy="12" r="1.2" fill="currentColor" />
                <circle cx="12" cy="12" r="1.2" fill="currentColor" />
                <circle cx="19" cy="12" r="1.2" fill="currentColor" />
              </svg>
            </button>
            {menuOpen && (
              <div role="menu" className="absolute end-0 top-11 z-30 min-w-[10.5rem] rounded-2xl border border-slate-700 bg-[#0a1024]/95 p-1.5 shadow-xl backdrop-blur-xl">
                {[
                  [x.testMe, `/tutor/${materialId}/exam`],
                  [x.gapMap, `/tutor/${materialId}/report`],
                  [t.newChat, "/tutor"],
                ].map(([label, href]) => (
                  <button key={href} role="menuitem" type="button" onClick={() => { setMenuOpen(false); router.push(href); }} className="w-full rounded-xl px-3 py-2 text-start text-sm text-slate-200 transition hover:bg-white/10">
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <Link href="/tutor" className="shrink-0 text-xs text-slate-400 transition hover:text-slate-100">
            {t.backToMaterials}
          </Link>
          {material?.title && (
            <span dir="auto" className="course-chip">
              <span aria-hidden="true">📄</span>
              <span className="truncate">{material.title}</span>
              <span className="hidden text-slate-500 sm:inline">· {x.courseMaterial}</span>
            </span>
          )}
        </div>
        <SummaryButton materialId={materialId} userId={userId} />
      </div>
    </header>
  );
}
