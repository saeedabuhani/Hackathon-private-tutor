"use client";

import { useTutorText } from "./tutorText";

const ICONS = {
  chats: <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12Z" />,
  library: (
    <>
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H9v16H5.5A1.5 1.5 0 0 1 4 18.5v-13Z" />
      <path d="M9 4h3.5A1.5 1.5 0 0 1 14 5.5V20H9V4Z" />
      <path d="m15.5 6.2 3.3-.9a1.5 1.5 0 0 1 1.8 1.1l2.2 9-3.3.9-3.9-9.1Z" transform="translate(-2 1)" />
    </>
  ),
  tools: <path d="M14.7 6.3a4 4 0 0 0-5.4 5.1L3 17.7 6.3 21l6.3-6.3a4 4 0 0 0 5.1-5.4l-2.6 2.6-2.4-.7-.7-2.4 2.7-2.5Z" />,
  notes: (
    <>
      <path d="M6 3h9l4 4v14H6V3Z" />
      <path d="M15 3v4h4M9 12h7M9 16h7" />
    </>
  ),
  favorites: <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8L3.5 9.7l5.9-.9L12 3.5Z" />,
};

const ITEMS = ["chats", "library", "tools", "notes", "favorites"];
const LABEL_KEY = {
  chats: "navChats",
  library: "navLibrary",
  tools: "navTools",
  notes: "navNotes",
  favorites: "navFavorites",
};

// Floating glass navigation under the Tutor. It switches what the cards on the side show
// (conversations, library, study tools, notes, favorites).
export default function BottomNav({ active, onChange }) {
  const { x } = useTutorText();
  return (
    <nav className="bottom-nav" aria-label="Tutor">
      {ITEMS.map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          aria-pressed={active === id}
          className={`bottom-nav-item ${active === id ? "is-active" : ""}`}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {ICONS[id]}
          </svg>
          <span>{x[LABEL_KEY[id]]}</span>
        </button>
      ))}
    </nav>
  );
}
