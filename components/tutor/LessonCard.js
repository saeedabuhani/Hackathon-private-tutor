"use client";

// A floating "lesson" card for the rails around the Tutor: conversations, materials, topics, tools.
// Depth (tilt, size, blur), the slow float and the parallax are all CSS in app/(main)/tutor/tutor.css.
// `accent` picks the tint of the icon tile: purple | blue | cyan | green | amber.
// Moves the soft light on the card to the pointer (sets two CSS variables; no re-render)
export function trackLight(e) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  el.style.setProperty("--px", `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
  el.style.setProperty("--py", `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
}

export default function LessonCard({
  icon,
  title,
  subtitle,
  meta,
  tag,
  accent = "purple",
  active = false,
  onClick,
  menu = null,
}) {
  const interactive = typeof onClick === "function";
  return (
    <div className="rail-card">
      <div
        role={interactive ? "button" : undefined}
        tabIndex={interactive ? 0 : undefined}
        onClick={onClick}
        onKeyDown={interactive ? (e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onClick(e)) : undefined}
        onPointerMove={trackLight}
        className={`lesson-card group ${active ? "is-active" : ""} ${interactive ? "cursor-pointer" : ""}`}
      >
        <div className={`lesson-icon accent-${accent}`} aria-hidden="true">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p dir="auto" className="lesson-title">
            {title}
          </p>
          {subtitle && (
            <p dir="auto" className="lesson-sub">
              {subtitle}
            </p>
          )}
          {(tag || meta) && (
            <div className="lesson-meta">
              {tag && <span className="lesson-tag">{tag}</span>}
              {meta && <span>{meta}</span>}
            </div>
          )}
        </div>
        {menu}
      </div>
    </div>
  );
}
