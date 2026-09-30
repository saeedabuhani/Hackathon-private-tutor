"use client";

import LessonCard from "./LessonCard";
import { useTutorText } from "./tutorText";
import { sessionKey, materialKey } from "./favorites";
import { formatRelativeDay, parseDbDate } from "@/lib/dates";
import { useTranslation } from "@/lib/translations";

const ACCENTS = ["purple", "blue", "cyan", "green", "amber"];
const TOPIC_ICONS = ["💡", "🧩", "⚙️", "📐", "🔗", "🧠"];

function Section({ title, children }) {
  return (
    <div>
      <h2 className="rail-title">{title}</h2>
      <div className="rail-list">{children}</div>
    </div>
  );
}

// The user's materials. Click one to start a chat about it.
export function LibraryPanel({ materials, currentMaterialId, onOpenMaterial }) {
  const { locale } = useTranslation();
  const { x } = useTutorText();
  return (
    <Section title={x.railLibrary}>
      {materials.length === 0 && <p className="rail-note">{x.noTopics}</p>}
      {materials.map((m, i) => (
        <LessonCard
          key={m.id}
          icon="📄"
          accent={ACCENTS[i % ACCENTS.length]}
          title={m.title}
          subtitle={(m.topics || []).slice(0, 3).join(" · ")}
          tag={m.file_type ? String(m.file_type).toUpperCase() : undefined}
          meta={parseDbDate(m.created_at).toLocaleDateString(locale)}
          active={currentMaterialId === m.id}
          onClick={() => onOpenMaterial(m)}
        />
      ))}
    </Section>
  );
}

// Shortcuts that work on the material being studied
export function ToolsPanel({ materialId, onGo, onSummarize }) {
  const { x } = useTutorText();
  if (!materialId) {
    return (
      <Section title={x.railTools}>
        <LessonCard icon="🧰" accent="amber" title={x.openMaterialFirst} subtitle={x.openMaterialFirstSub} />
      </Section>
    );
  }
  return (
    <Section title={x.railTools}>
      <LessonCard icon="🎓" accent="blue" title={x.toolExam} subtitle={x.toolExamSub} onClick={() => onGo(`/tutor/${materialId}/exam`)} />
      <LessonCard icon="📊" accent="green" title={x.toolGap} subtitle={x.toolGapSub} onClick={() => onGo(`/tutor/${materialId}/report`)} />
      <LessonCard icon="📋" accent="purple" title={x.toolSummary} subtitle={x.toolSummarySub} onClick={onSummarize} />
    </Section>
  );
}

// Conversations and materials the user starred with the bookmark button
export function FavoritesPanel({ sessions, materials, favorites, onOpenSession, onOpenMaterial }) {
  const { t, locale } = useTranslation();
  const { x } = useTutorText();
  const favSessions = sessions.filter((s) => favorites.includes(sessionKey(s.id)));
  const favMaterials = materials.filter((m) => favorites.includes(materialKey(m.id)));

  return (
    <Section title={x.railFavorites}>
      {favSessions.length + favMaterials.length === 0 && (
        <LessonCard icon="⭐" accent="amber" title={x.noFavorites} subtitle={x.noFavoritesSub} />
      )}
      {favSessions.map((s) => (
        <LessonCard
          key={s.id}
          icon="💬"
          accent="purple"
          title={s.materialTitle || t.studyMaterial}
          subtitle={s.preview || t.chatFallback}
          meta={formatRelativeDay(s.updated_at, t, locale)}
          onClick={() => onOpenSession(s)}
        />
      ))}
      {favMaterials.map((m) => (
        <LessonCard key={m.id} icon="📄" accent="blue" title={m.title} subtitle={(m.topics || []).slice(0, 3).join(" · ")} onClick={() => onOpenMaterial(m)} />
      ))}
    </Section>
  );
}

export function NotesPanel() {
  const { x } = useTutorText();
  return (
    <Section title={x.railNotes}>
      <LessonCard icon="📝" accent="cyan" title={x.notesSoon} subtitle={x.notesSoonSub} />
    </Section>
  );
}

// Right side: topics pulled from the materials (the open material's first). Click to ask about one.
export function TopicsRail({ materials, currentMaterialId, onOpenTopic }) {
  const { x } = useTutorText();
  const ordered = [...materials].sort((a, b) => (b.id === currentMaterialId) - (a.id === currentMaterialId));
  const cards = [];
  for (const m of ordered) {
    for (const topic of m.topics || []) cards.push({ m, topic });
  }
  return (
    <Section title={x.railTopics}>
      {cards.length === 0 && <p className="rail-note">{x.noTopics}</p>}
      {cards.slice(0, 8).map(({ m, topic }, i) => (
        <LessonCard
          key={`${m.id}-${topic}`}
          icon={TOPIC_ICONS[i % TOPIC_ICONS.length]}
          accent={ACCENTS[(i + 1) % ACCENTS.length]}
          title={topic}
          subtitle={m.title}
          tag={x.askAboutThis}
          onClick={() => onOpenTopic(m, topic)}
        />
      ))}
    </Section>
  );
}
