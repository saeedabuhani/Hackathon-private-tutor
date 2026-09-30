import "./nav.css";
import Link from "next/link";

// The Leviathan mark: a sea serpent rising out of the water inside a porthole ring, with a glowing
// eye. Drawn as inline SVG (no image file), coloured from the site palette so it follows dark/light.
export function LeviathanMark({ size = 42 }) {
  return (
    <svg className="lev-mark" viewBox="0 0 48 48" width={size} height={size} fill="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="lev-body" x1="6" y1="36" x2="42" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0" style={{ stopColor: "rgb(var(--accent-cyan))" }} />
          <stop offset="0.55" style={{ stopColor: "rgb(var(--accent-blue))" }} />
          <stop offset="1" style={{ stopColor: "rgb(var(--accent-purple))" }} />
        </linearGradient>
        <radialGradient id="lev-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0" style={{ stopColor: "rgb(var(--accent-cyan))", stopOpacity: 0.35 }} />
          <stop offset="1" style={{ stopColor: "rgb(var(--accent-cyan))", stopOpacity: 0 }} />
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="23" fill="url(#lev-glow)" />
      <circle className="lev-ring" cx="24" cy="24" r="21" stroke="url(#lev-body)" strokeWidth="1.2" strokeDasharray="2 2.6" opacity="0.6" />
      {/* the body: two humps coming out of the water, ending in the head */}
      <path d="M8 33C8 21 14 15 19.5 19.5C24.5 23.5 24 32 29.5 29C34.5 26.2 33 16.5 39 14.2" stroke="url(#lev-body)" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
      {/* dorsal spikes */}
      <path d="M11.6 19.6 10.6 14.4 15.8 17.4ZM16 17.2 17.6 12 21 18.4ZM21.2 19 24.4 14.8 25 22Z" fill="url(#lev-body)" opacity="0.92" />
      {/* the head, with a jaw and the eye */}
      <path d="M36.2 15.6C37 12.2 41 10.6 44 12.4C42.6 13.2 42.4 14.6 43.4 16C41.4 17.6 38 17.6 36.2 15.6Z" fill="url(#lev-body)" />
      <circle className="lev-eye" cx="40.6" cy="13.9" r="1.25" fill="#fff" />
      {/* water */}
      <path className="lev-wave" d="M6 37.5q3-2.2 6 0t6 0t6 0t6 0t6 0t6 0" stroke="rgb(var(--accent-cyan))" strokeWidth="1.5" strokeLinecap="round" opacity="0.85" />
      <path className="lev-wave lev-wave-2" d="M10 41.4q3-2 6 0t6 0t6 0t6 0t6 0" stroke="rgb(var(--accent-blue))" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

// Top-left brand of the header: mark + name, a link back to the start page.
export default function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Leviathan">
      <LeviathanMark />
      <span className="brand-word">Leviathan</span>
    </Link>
  );
}
