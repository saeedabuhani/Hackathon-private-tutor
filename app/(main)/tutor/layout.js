"use client";

import "./tutor.css";
import { Suspense, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import ChatSidebar from "@/components/tutor/ChatSidebar";
import BottomNav from "@/components/tutor/BottomNav";
import { FavoritesPanel, LibraryPanel, NotesPanel, ToolsPanel, TopicsRail } from "@/components/tutor/RailPanels";
import useTutorLibrary from "@/components/tutor/useTutorLibrary";
import useFavorites from "@/components/tutor/favorites";
import ToastHost from "@/components/tutor/toast";

// Every /tutor page shares this stage: the page itself in the middle (the Tutor panel), floating
// lesson cards on both sides, and a floating bottom bar that switches what the left cards show.
// The left cards sit at the start edge, so they move to the right in Hebrew / Arabic.
// Below the wide layout the side cards become one swipeable strip under the Tutor.
function TutorShell({ children }) {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const activeSessionId = searchParams.get("session");
  const materialId = params?.materialId;

  const library = useTutorLibrary(activeSessionId);
  const { favorites } = useFavorites();
  const [panel, setPanel] = useState("chats"); // chats | library | tools | notes | favorites
  const stageRef = useRef(null);

  // Very light parallax: the side cards drift a few pixels against the mouse
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || window.matchMedia("(hover: none)").matches) return;
    let frame = 0;
    function onMove(e) {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const box = el.getBoundingClientRect();
        el.style.setProperty("--mx", (((e.clientX - box.left) / box.width - 0.5) * 2).toFixed(3));
        el.style.setProperty("--my", (((e.clientY - box.top) / box.height - 0.5) * 2).toFixed(3));
      });
    }
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const openSession = (session) => router.push(`/tutor/${session.material_id}?session=${session.id}`);
  const openMaterial = (material) => router.push(`/tutor/${material.id}`);
  const openTopic = (material, topic) => router.push(`/tutor/${material.id}?topic=${encodeURIComponent(topic)}`);
  const newChat = () => router.push("/tutor");

  const left = {
    chats: (
      <ChatSidebar
        sessions={library.sessions}
        loading={library.loading}
        error={library.error}
        activeSessionId={activeSessionId}
        onSessionSelect={openSession}
        onNewChat={newChat}
        onDelete={library.deleteSession}
      />
    ),
    library: <LibraryPanel materials={library.materials} currentMaterialId={materialId} onOpenMaterial={openMaterial} />,
    tools: (
      <ToolsPanel
        materialId={materialId}
        onGo={(href) => router.push(href)}
        onSummarize={() => window.dispatchEvent(new Event("tutor:summarize"))}
      />
    ),
    notes: <NotesPanel />,
    favorites: (
      <FavoritesPanel
        sessions={library.sessions}
        materials={library.materials}
        favorites={favorites}
        onOpenSession={openSession}
        onOpenMaterial={openMaterial}
      />
    ),
  }[panel];

  const right = <TopicsRail materials={library.materials} currentMaterialId={materialId} onOpenTopic={openTopic} />;

  return (
    <div ref={stageRef} className="tutor-stage">
      {/* Portals to <body> (see toast.js) — .tutor-stage's `isolation: isolate` would otherwise
          trap its stacking below the page header, whatever z-index it's given. */}
      <ToastHost />
      <div className="tutor-grid">
        <aside className="rail rail-start">{left}</aside>

        <div className="min-w-0">{children}</div>

        <aside className="rail rail-end">{right}</aside>
      </div>

      <div className="rail-carousel mx-auto mt-4 max-w-3xl">
        {left}
        {right}
      </div>

      <BottomNav active={panel} onChange={setPanel} />
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
