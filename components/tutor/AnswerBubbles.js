"use client";

import { useMemo } from "react";

// A dozen small bubbles that rise out of the message box when the AI answers, then fade.
// Pure CSS motion (transform + opacity), remounted with a new `key` for every answer.
export default function AnswerBubbles() {
  const bubbles = useMemo(
    () =>
      Array.from({ length: 12 }, () => ({
        left: 12 + Math.random() * 76, // % across the box
        size: 4 + Math.random() * 7,
        delay: Math.random() * 0.7,
        dur: 1.7 + Math.random() * 1.1,
        rise: 150 + Math.random() * 130,
        drift: (Math.random() - 0.5) * 34,
      })),
    []
  );
  return (
    <div className="answer-bubbles" aria-hidden="true">
      {bubbles.map((b, i) => (
        <i
          key={i}
          style={{
            left: `${b.left}%`,
            width: b.size,
            height: b.size,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.dur}s`,
            "--rise": `${b.rise}px`,
            "--drift": `${b.drift}px`,
          }}
        />
      ))}
    </div>
  );
}
