"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ChatSidebar from "@/components/tutor/ChatSidebar";
import { useTranslation } from "@/lib/translations";

// Every /tutor page shares this shell: saved conversations on one side, the page on the other
// (the sidebar sits at the start edge, so it moves to the right in Hebrew / Arabic).
// On small screens the sidebar is a drawer opened from the "☰ Chats" button.
function TutorShell({ children }) {
  const router = useRouter();
  const { t } = useTranslation();
  const activeSessionId = useSearchParams().get("session");
  const [drawerOpen, setDrawerOpen] = useState(false);

  function openSession(session) {
    setDrawerOpen(false);
    router.push(`/tutor/${session.material_id}?session=${session.id}`);
  }

  function newChat() {
    setDrawerOpen(false);
    router.push("/tutor");
  }

  const sidebar = (
    <ChatSidebar
      activeSessionId={activeSessionId}
      onSessionSelect={openSession}
      onNewChat={newChat}
    />
  );

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      <aside className="hidden w-[280px] shrink-0 border-e border-slate-800 bg-slate-950 py-4 md:block">
        {sidebar}
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="w-[280px] max-w-[85vw] border-e border-slate-800 bg-slate-950 py-4">
            {sidebar}
          </div>
          <div className="flex-1 bg-black/60" onClick={() => setDrawerOpen(false)} />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="border-b border-slate-800 p-2 md:hidden">
          <button
            onClick={() => setDrawerOpen(true)}
            className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm hover:bg-slate-700"
          >
            {t.chatsButton}
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function TutorLayout({ children }) {
  // useSearchParams needs a Suspense boundary so the static /tutor page can still prerender
  return (
    <Suspense fallback={null}>
      <TutorShell>{children}</TutorShell>
    </Suspense>
  );
}
