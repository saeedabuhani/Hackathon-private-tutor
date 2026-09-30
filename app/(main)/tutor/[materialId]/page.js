"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import useStore from "@/store/useStore";
import StuckInput from "@/components/tutor/StuckInput";
import TutorPanelHeader from "@/components/tutor/TutorPanelHeader";

export default function MaterialPage({ params }) {
  const { materialId } = params;
  const user = useStore((s) => s.user);
  const setActiveTopic = useStore((s) => s.setActiveTopic);
  const setActiveMaterialId = useStore((s) => s.setActiveMaterialId);
  const searchParams = useSearchParams();
  // "Learn deeper" from the Feed (and the topic cards next to the Tutor) arrive with ?topic=...
  const initialTopic = searchParams.get("topic") || "";
  // The cards on the side open a saved conversation with ?session=<id>
  const sessionId = searchParams.get("session");
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
    setActiveTopic(topic); // syncs StudyFeed
  }

  // A brand-new chat just got saved: put its id in the URL (without a navigation, so the
  // chat on screen isn't reset) so a refresh or the side cards reopen the same conversation.
  function handleSessionCreated(id) {
    const url = new URL(window.location.href);
    url.searchParams.set("session", id);
    url.searchParams.delete("topic");
    window.history.replaceState(null, "", url);
  }

  // The chat, the Test-me / Gap-map links (in the ⋯ menu and the Practice Quiz card) and the
  // summary button all live inside the one central panel.
  return user?.id ? (
    <StuckInput
      materialId={materialId}
      userId={user.id}
      topics={material?.topics}
      onTopicDetected={handleTopicDetected}
      sessionId={sessionId}
      onSessionCreated={handleSessionCreated}
      initialValue={initialTopic}
      header={<TutorPanelHeader materialId={materialId} material={material} sessionId={sessionId} userId={user.id} />}
    />
  ) : null;
}
