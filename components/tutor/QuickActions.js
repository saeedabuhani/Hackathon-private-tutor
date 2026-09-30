"use client";

import { useTutorText } from "./tutorText";
import { trackLight } from "./LessonCard";

const ICON_PROPS = { viewBox: "0 0 24 24", width: 22, height: 22, fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" };

const ICONS = {
  interactive: (
    <svg {...ICON_PROPS}>
      <path d="M8 5v14l11-7L8 5Z" />
    </svg>
  ),
  visual: (
    <svg {...ICON_PROPS}>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  ),
  quiz: (
    <svg {...ICON_PROPS}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.8-.9 1.4M12 17h.01" />
    </svg>
  ),
  related: (
    <svg {...ICON_PROPS}>
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <path d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6" />
    </svg>
  ),
};

// Four glass cards under an AI answer. Three of them send a ready-made follow-up question into
// the same chat; "Practice Quiz" opens the exam page for the topic.
export default function QuickActions({ topic, disabled, onAsk, onQuiz }) {
  const { x } = useTutorText();
  const actions = [
    { id: "interactive", accent: "blue", title: x.qaInteractive, sub: x.qaInteractiveSub, run: () => onAsk(x.promptInteractive(topic)) },
    { id: "visual", accent: "purple", title: x.qaVisual, sub: x.qaVisualSub, run: () => onAsk(x.promptVisual(topic)) },
    { id: "quiz", accent: "green", title: x.qaQuiz, sub: x.qaQuizSub, run: () => onQuiz(topic) },
    { id: "related", accent: "amber", title: x.qaRelated, sub: x.qaRelatedSub, run: () => onAsk(x.promptRelated(topic)) },
  ];

  return (
    <div className="quick-actions">
      {actions.map((a) => (
        <button key={a.id} type="button" disabled={disabled} onClick={a.run} onPointerMove={trackLight} className={`quick-card accent-${a.accent}`}>
          <span className="quick-icon">{ICONS[a.id]}</span>
          <span className="min-w-0 text-start">
            <span className="block text-sm font-semibold text-slate-100">{a.title}</span>
            <span className="block text-xs text-slate-400">{a.sub}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
