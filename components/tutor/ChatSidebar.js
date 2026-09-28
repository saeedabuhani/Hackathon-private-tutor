"use client";

import { useCallback, useEffect, useState } from "react";
import { authFetch } from "@/lib/authFetch";
import { SESSIONS_CHANGED_EVENT } from "@/lib/chatSessions";
import { formatRelativeDay } from "@/lib/dates";
import { useTranslation } from "@/lib/translations";

// Saved conversations, newest first. Click one to reopen it with its full history; the
// ··· menu deletes it.
export default function ChatSidebar({ activeSessionId, onSessionSelect, onNewChat }) {
  const { t, locale } = useTranslation();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(null); // id of the session whose menu is open

  const fetchSessions = useCallback(async () => {
    try {
      const res = await authFetch("/api/sessions");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load conversations");
      setSessions(data.sessions || []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refetch when the open conversation changes (a new one was just created) and whenever
  // the chat or a material deletion says the list changed
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions, activeSessionId]);

  useEffect(() => {
    window.addEventListener(SESSIONS_CHANGED_EVENT, fetchSessions);
    return () => window.removeEventListener(SESSIONS_CHANGED_EVENT, fetchSessions);
  }, [fetchSessions]);

  // Click anywhere else closes the open menu
  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [menuOpen]);

  async function handleDelete(sessionId, e) {
    e.stopPropagation();
    setMenuOpen(null);
    if (!confirm(t.confirmDeleteChat)) return;

    try {
      const res = await authFetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Delete failed");
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeSessionId === sessionId) onNewChat();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-800 px-4 pb-4 pt-2">
        <h2 className="mb-3 text-lg font-bold">🧠 {t.tutor}</h2>
        <button
          onClick={onNewChat}
          className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          {t.newChat}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {loading && <p className="p-5 text-center text-sm text-slate-500">{t.loadingChats}</p>}
        {error && <p className="px-4 py-2 text-xs text-red-400">{error}</p>}
        {!loading && !error && sessions.length === 0 && (
          <p className="p-5 text-center text-sm text-slate-500">{t.noChatsYet}</p>
        )}

        {sessions.map((session) => {
          const active = activeSessionId === session.id;
          return (
            <div
              key={session.id}
              role="button"
              tabIndex={0}
              onClick={() => onSessionSelect(session)}
              onKeyDown={(e) => e.key === "Enter" && onSessionSelect(session)}
              className={`group relative cursor-pointer border-s-[3px] px-4 py-3 transition-colors ${
                active
                  ? "border-indigo-500 bg-slate-900"
                  : "border-transparent hover:bg-slate-900/60"
              }`}
            >
              <p dir="auto" className="mb-1 truncate pe-8 text-[13px] font-semibold">
                📄 {session.materialTitle || t.studyMaterial}
              </p>
              <p dir="auto" className="mb-1 truncate pe-8 text-xs text-slate-400">
                {session.preview || t.chatFallback}
              </p>
              <p className="text-[11px] text-slate-500">
                {formatRelativeDay(session.updated_at, t, locale)}
              </p>

              <button
                type="button"
                aria-label={t.chatOptionsAria}
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(menuOpen === session.id ? null : session.id);
                }}
                className={`absolute end-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-lg leading-none text-slate-400 hover:bg-slate-800 hover:text-slate-100 focus:opacity-100 [@media(hover:none)]:opacity-100 ${
                  menuOpen === session.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
              >
                ···
              </button>

              {menuOpen === session.id && (
                <div className="absolute end-2 top-full z-50 mt-1 min-w-[130px] rounded-lg border border-slate-700 bg-slate-800 p-1 shadow-lg">
                  <button
                    onClick={(e) => handleDelete(session.id, e)}
                    className="w-full rounded-md px-3 py-2 text-start text-[13px] text-red-400 hover:bg-slate-700"
                  >
                    {t.deleteChat}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
