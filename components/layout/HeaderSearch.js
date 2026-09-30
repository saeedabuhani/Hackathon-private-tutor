"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import useStore from "@/store/useStore";
import { authFetch } from "@/lib/authFetch";
import { useTranslation } from "@/lib/translations";

// Search texts live here so the top bar doesn't depend on the Tutor's files
const TEXT = {
  en: { placeholder: "Search materials, topics…", materials: "Materials", chats: "Conversations", topics: "Topics", none: "No results" },
  he: { placeholder: "חיפוש חומרים, נושאים…", materials: "חומרים", chats: "שיחות", topics: "נושאים", none: "אין תוצאות" },
  ar: { placeholder: "ابحث في المواد والمواضيع…", materials: "المواد", chats: "المحادثات", topics: "المواضيع", none: "لا نتائج" },
};

// Search box in the top bar: looks through your materials, saved conversations and topics.
// Ctrl / ⌘ + K focuses it, the arrow keys move, Enter opens, Escape closes.
export default function HeaderSearch() {
  const router = useRouter();
  const { lang } = useTranslation();
  const x = TEXT[lang] || TEXT.en;
  const userId = useStore((s) => s.user?.id);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [cursor, setCursor] = useState(0);
  const loadedRef = useRef(false);
  const inputRef = useRef(null);
  const rootRef = useRef(null);

  // Load the lists the first time the box is used
  async function load() {
    if (loadedRef.current || !userId) return;
    loadedRef.current = true;
    try {
      const [m, s] = await Promise.all([
        fetch(`/api/materials?userId=${userId}`).then((r) => r.json()),
        authFetch("/api/sessions").then((r) => r.json()),
      ]);
      setMaterials(m.materials || []);
      setSessions(s.sessions || []);
    } catch {
      loadedRef.current = false; // try again next time
    }
  }

  useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    function onDown(e) {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, []);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const has = (text) => String(text || "").toLowerCase().includes(q);
    const ms = materials
      .filter((m) => !q || has(m.title) || (m.topics || []).some(has))
      .slice(0, 4)
      .map((m) => ({ key: `m${m.id}`, icon: "📄", label: m.title, hint: (m.topics || []).slice(0, 2).join(" · "), href: `/tutor/${m.id}` }));
    const cs = sessions
      .filter((s) => !q || has(s.materialTitle) || has(s.preview))
      .slice(0, 4)
      .map((s) => ({ key: `s${s.id}`, icon: "💬", label: s.materialTitle, hint: s.preview, href: `/tutor/${s.material_id}?session=${s.id}` }));
    const ts = q
      ? materials
          .flatMap((m) => (m.topics || []).filter(has).map((topic) => ({ m, topic })))
          .slice(0, 4)
          .map(({ m, topic }) => ({ key: `t${m.id}${topic}`, icon: "💡", label: topic, hint: m.title, href: `/tutor/${m.id}?topic=${encodeURIComponent(topic)}` }))
      : [];
    return [
      { title: x.materials, items: ms },
      { title: x.chats, items: cs },
      { title: x.topics, items: ts },
    ].filter((g) => g.items.length);
  }, [query, materials, sessions, x]);

  const flat = groups.flatMap((g) => g.items);

  function go(item) {
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
    router.push(item.href);
  }

  function onKeyDown(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter" && flat[cursor]) {
      e.preventDefault();
      go(flat[cursor]);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  let index = -1;
  return (
    <div ref={rootRef} className="relative hidden xl:block">
      <div className="flex w-44 items-center gap-2 rounded-full border border-slate-700 bg-slate-900/50 px-3 py-1.5 transition focus-within:border-indigo-400/50 2xl:w-64">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="shrink-0 text-slate-400" aria-hidden="true">
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4 4" />
        </svg>
        <input
          ref={inputRef}
          dir="auto"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setCursor(0);
            setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            load();
          }}
          onKeyDown={onKeyDown}
          placeholder={x.placeholder}
          aria-label={x.placeholder}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-500"
        />
        {!query && (
          <kbd dir="ltr" className="hidden shrink-0 rounded-md border border-slate-700 px-1.5 text-[10px] text-slate-500 2xl:block">
            Ctrl K
          </kbd>
        )}
      </div>

      {open && (
        <div className="absolute end-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-700 bg-[#0a1024]/95 p-1.5 shadow-xl backdrop-blur-xl">
          {flat.length === 0 && <p className="px-3 py-3 text-sm text-slate-500">{x.none}</p>}
          {groups.map((g) => (
            <div key={g.title}>
              <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{g.title}</p>
              {g.items.map((item) => {
                index += 1;
                const i = index;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onMouseEnter={() => setCursor(i)}
                    onClick={() => go(item)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-start transition ${cursor === i ? "bg-white/10" : ""}`}
                  >
                    <span aria-hidden="true">{item.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span dir="auto" className="block truncate text-sm text-slate-100">{item.label}</span>
                      {item.hint && <span dir="auto" className="block truncate text-xs text-slate-500">{item.hint}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
