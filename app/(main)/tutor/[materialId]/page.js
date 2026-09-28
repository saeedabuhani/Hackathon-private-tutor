"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import useStore from "@/store/useStore";
import StuckInput from "@/components/tutor/StuckInput";
import SummaryButton from "@/components/tutor/SummaryButton";
import { useTranslation } from "@/lib/translations";

export default function MaterialPage({ params }) {
  const { materialId } = params;
  const { t } = useTranslation();
  const user = useStore((s) => s.user);
  const setActiveTopic = useStore((s) => s.setActiveTopic);
  const setActiveMaterialId = useStore((s) => s.setActiveMaterialId);
  const searchParams = useSearchParams();
  // "Learn deeper" from the Feed arrives with ?topic=...
  const initialTopic = searchParams.get("topic") || "";
  // The sidebar opens a saved conversation with ?session=<id>
  const sessionId = searchParams.get("session");
  // Scoped to this page (not the global store) so the link only shows once THIS
  // material's chat has actually surfaced a topic.
  const [currentTopic, setCurrentTopic] = useState("");
  const [material, setMaterial] = useState(null);

  useEffect(() => {
    setActiveMaterialId(materialId);
  }, [materialId, setActiveMaterialId]);

  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/materials?userId=${user.id}&materialId=${materialId}`)
      .then((res) => res.json())
      .then((data) => data.material && setMaterial(data.material))
      .catch(() => {});
  }, [user?.id, materialId]);

  function handleTopicDetected(topic) {
    setCurrentTopic(topic);
    setActiveTopic(topic); // syncs StudyFeed
  }

  // A brand-new chat just got saved: put its id in the URL (without a navigation, so the
  // chat on screen isn't reset) so a refresh or the sidebar reopens the same conversation.
  function handleSessionCreated(id) {
    const url = new URL(window.location.href);
    url.searchParams.set("session", id);
    url.searchParams.delete("topic");
    window.history.replaceState(null, "", url);
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Link href="/tutor" className="text-sm text-slate-400 hover:text-slate-100 shrink-0">
          {t.backToMaterials}
        </Link>
        {material?.title && (
          <h1 dir="auto" className="text-sm text-slate-300 truncate">
            📄 {material.title}
          </h1>
        )}
        <SummaryButton materialId={materialId} userId={user?.id} />
      </div>

      {user?.id && (
        <StuckInput
          materialId={materialId}
          userId={user.id}
          topics={material?.topics}
          onTopicDetected={handleTopicDetected}
          sessionId={sessionId}
          onSessionCreated={handleSessionCreated}
          initialValue={initialTopic}
        />
      )}

      <div className="flex flex-wrap gap-3 text-sm">
        {currentTopic && (
          <Link
            href={`/tutor/${materialId}/exam?topic=${encodeURIComponent(currentTopic)}`}
            className="rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2"
          >
            🎓 {t.testMeOn} <bdi>{currentTopic}</bdi>
          </Link>
        )}
        <Link
          href={`/tutor/${materialId}/report`}
          className="rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2"
        >
          📊 {t.gapMapTitle}
        </Link>
      </div>
    </div>
  );
}
