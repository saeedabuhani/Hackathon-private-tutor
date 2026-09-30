"use client";

import { useEffect, useState } from "react";
import LessonCard from "./LessonCard";
import ConfirmDialog from "./ConfirmDialog";
import { notify } from "./toast";
import { useTutorText } from "./tutorText";
import { formatRelativeDay } from "@/lib/dates";
import { useTranslation } from "@/lib/translations";

const ACCENTS = ["purple", "blue", "cyan"];

// Saved conversations, newest first, as floating cards. Click one to reopen it with its full
// history; the ··· menu deletes it, after a styled confirm dialog (not the browser's own
// confirm()) and with a toast once it's gone. (The data and the delete call come from
// useTutorLibrary.)
export default function ChatSidebar({
  sessions,
  loading,
  error,
  activeSessionId,
  onSessionSelect,
  onNewChat,
  onDelete,
}) {
  const { t, locale } = useTranslation();
  const { x } = useTutorText();
  const [menuOpen, setMenuOpen] = useState(null); // id of the session whose menu is open
  const [pendingDelete, setPendingDelete] = useState(null); // the session asked about in the confirm dialog
  const [deleting, setDeleting] = useState(false);

  // Click anywhere else closes the open menu
  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [menuOpen]);

  function requestDelete(session, e) {
    e.stopPropagation();
    setMenuOpen(null);
    setPendingDelete(session);
  }

  async function confirmDelete() {
    const session = pendingDelete;
    if (!session) return;
    setDeleting(true);
    const ok = await onDelete(session.id);
    setDeleting(false);
    setPendingDelete(null);
    if (ok) {
      if (activeSessionId === session.id) onNewChat();
      notify({ message: t.chatDeletedToast, tone: "danger" });
    } else {
      notify({ message: t.deleteFailedToast, tone: "danger" });
    }
  }

  return (
    <div>
      <h2 className="rail-title">{x.railChats}</h2>
      <div className="rail-list">
        <LessonCard icon="＋" title={x.newChatCard} subtitle={x.newChatSub} accent="green" onClick={onNewChat} />

        {loading && <p className="rail-note">{t.loadingChats}</p>}
        {error && <p className="rail-note text-red-400">{error}</p>}
        {!loading && !error && sessions.length === 0 && <p className="rail-note">{t.noChatsYet}</p>}

        {sessions.map((session, i) => (
          <LessonCard
            key={session.id}
            icon="💬"
            accent={ACCENTS[i % ACCENTS.length]}
            title={session.materialTitle || t.studyMaterial}
            subtitle={session.preview || t.chatFallback}
            meta={formatRelativeDay(session.updated_at, t, locale)}
            active={activeSessionId === session.id}
            onClick={() => onSessionSelect(session)}
            menu={
              <>
                <button
                  type="button"
                  aria-label={t.chatOptionsAria}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(menuOpen === session.id ? null : session.id);
                  }}
                  className={`lesson-menu-btn focus:opacity-100 [@media(hover:none)]:opacity-100 ${
                    menuOpen === session.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                >
                  ···
                </button>
                {menuOpen === session.id && (
                  <div className="absolute end-2 top-9 z-50 min-w-[130px] rounded-xl border border-slate-700 bg-[#0a1024] p-1 shadow-lg">
                    <button
                      onClick={(e) => requestDelete(session, e)}
                      className="w-full rounded-lg px-3 py-2 text-start text-[13px] text-red-400 hover:bg-white/5"
                    >
                      {t.deleteChat}
                    </button>
                  </div>
                )}
              </>
            }
          />
        ))}
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={t.deleteChatTitle}
        message={t.confirmDeleteChat}
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setPendingDelete(null)}
      />
    </div>
  );
}
