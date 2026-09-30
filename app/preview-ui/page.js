"use client";

// TEMPORARY visual-check page (deleted after the UI review). No login needed.
import TopNav from "@/components/layout/TopNav";
import MaterialsGrid from "@/components/tutor/MaterialsGrid";
import ExamCard from "@/components/tutor/ExamCard";
import GapMap from "@/components/tutor/GapMap";
import LanguageBridge from "@/components/tutor/LanguageBridge";
import MessageContent from "@/components/tutor/MessageContent";
import StuckInput from "@/components/tutor/StuckInput";
import SummaryButton from "@/components/tutor/SummaryButton";
import FeedSyncBanner from "@/components/feed/FeedSyncBanner";
import VideoSidebar from "@/components/feed/VideoSidebar";
import ExploreQuestion from "@/components/explore/ExploreQuestion";
import { STUCK_TYPE_BADGES } from "@/lib/stuckTypes";
import { VIDEO_FRAME, VIDEO_FRAME_STYLE, VIDEO_LAYOUT } from "@/lib/videoFrame";
import { useTranslation } from "@/lib/translations";

const materials = [
  { id: "1", title: "JavaScript Basics", topics: ["Variables", "Loops", "Functions", "Arrays"], created_at: "2026-09-20T10:00:00" },
  { id: "2", title: "מבוא לבסיסי נתונים", topics: ["SQL", "אינדקסים"], created_at: "2026-09-21T10:00:00" },
];
const gaps = [
  { id: "a", topic: "async/await", score_avg: 35, attempts_count: 3, stuck_count: 2 },
  { id: "b", topic: "Closures", score_avg: 88, attempts_count: 4, stuck_count: 0 },
  { id: "c", topic: "Promises", score_avg: 0, attempts_count: 0, stuck_count: 1 },
];
const videos = [
  { id: "v1", title: "What is a closure?", thumbnail: "", channel: "Fireship", duration: "1:02" },
  { id: "v2", title: "הסבר על פונקציות", thumbnail: "", channel: "קורס", duration: "4:10" },
];
const exam = { question: "Why does `typeof null` return 'object'?", hint: "Review the section on primitives.", sourceReference: "Slide 12" };
const md = "## 📌 In-depth explanation\nAccording to your material, **closures** keep access to their scope.\n\n```javascript\nconst add = (a) => (b) => a + b;\nconsole.log(add(1)(2)); // 3\n```\n\n- point one\n- point two with `inline code`";

export default function PreviewUI() {
  const { t } = useTranslation();
  return (
    <div>
      <TopNav />
      <div className="mx-auto max-w-5xl space-y-6 p-4">
        <FeedSyncBanner topic="async/await" onDismiss={() => {}} />
        <SummaryButton materialId="demo" userId="demo" />

        <MaterialsGrid materials={materials} onSelect={() => {}} onRequestDelete={() => {}} />

        <div className="flex flex-wrap gap-2">
          {Object.entries(STUCK_TYPE_BADGES).map(([k, b]) => (
            <span key={k} className={`rounded-lg px-3 py-1.5 text-xs ${b.className}`}>
              {k}
            </span>
          ))}
          <span className="text-red-400 text-sm">error text</span>
          <span className="text-emerald-400 text-sm">success text</span>
          <span className="text-amber-400 text-sm">{t.xpPoints(120)}</span>
        </div>

        <LanguageBridge bridge={{ original_term: "async/await", slide_ref: "Slide 27", translation: "async/await" }} />
        <ExamCard exam={exam} onSubmit={() => {}} loading={false} result={{ isCorrect: false, score: 40, feedback: "Look at the spec again." }} />
        <ExamCard exam={{ ...exam, question: "מה יחזיר typeof null?" }} onSubmit={() => {}} loading={false} result={{ isCorrect: true, score: 90, feedback: "מצוין." }} />
        <GapMap gaps={gaps} />
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <MessageContent content={md} />
        </div>

        <div className={VIDEO_LAYOUT}>
          <div className={VIDEO_FRAME} style={VIDEO_FRAME_STYLE}>
            <ExploreQuestion
              quiz={{ question: "What is a closure?", optionA: "A function with its scope", optionB: "A loop", optionC: "A class", correct: "A" }}
              onAnswer={() => {}}
            />
          </div>
          <VideoSidebar videos={videos} currentId="v1" watchedIds={new Set(["v2"])} onSelect={() => {}} />
        </div>

        <StuckInput materialId="x" userId="u" topics={["Variables", "Loops"]} />
      </div>
    </div>
  );
}
