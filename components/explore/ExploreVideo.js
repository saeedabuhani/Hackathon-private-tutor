"use client";

import { useEffect, useRef, useState } from "react";
import { loadYouTubeApi } from "@/lib/youtubePlayer";
import { VIDEO_FRAME, VIDEO_FRAME_STYLE, VIDEO_PLAYER_STYLE } from "@/lib/videoFrame";
import { useTranslation } from "@/lib/translations";

const QUESTION_AFTER_SEC = 45;
const SKIP_SEC = 5;

// Autoplaying short video with a 45s-or-ended trigger for the follow-up question.
// `children` (the quiz / explanation overlays) are drawn inside the video frame.
// Render with key={video.youtubeId} so each video gets a fresh player.
export default function ExploreVideo({ video, onReady, onTrigger, children }) {
  const { t } = useTranslation();
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const triggeredRef = useRef(false);
  const onTriggerRef = useRef(onTrigger);
  onTriggerRef.current = onTrigger;
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  const [progress, setProgress] = useState(0);

  function fire() {
    if (triggeredRef.current) return;
    triggeredRef.current = true;
    onTriggerRef.current?.();
  }

  useEffect(() => {
    let cancelled = false;
    let interval = null;
    const container = containerRef.current;

    loadYouTubeApi().then((YT) => {
      if (cancelled || !container) return;
      const mount = document.createElement("div");
      container.appendChild(mount);
      playerRef.current = new YT.Player(mount, {
        width: "100%",
        height: "100%",
        videoId: video.youtubeId,
        playerVars: { autoplay: 1, rel: 0, playsinline: 1, modestbranding: 1 },
        events: {
          onReady: () => {
            onReadyRef.current?.(playerRef.current);
            interval = setInterval(() => {
              const time = playerRef.current?.getCurrentTime?.() || 0;
              const duration = playerRef.current?.getDuration?.() || video.durationSec || QUESTION_AFTER_SEC;
              setProgress(Math.min(100, (time / Math.min(duration, QUESTION_AFTER_SEC)) * 100));
              if (time >= QUESTION_AFTER_SEC) fire();
            }, 500);
          },
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.ENDED) {
              setProgress(100);
              fire();
            }
          },
          // Video removed/private/embedding disabled -> skip to the question anyway
          onError: () => fire(),
        },
      });
    });

    return () => {
      cancelled = true;
      clearInterval(interval);
      playerRef.current?.destroy?.();
      playerRef.current = null;
      if (container) container.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video.youtubeId]);

  function skip() {
    const player = playerRef.current;
    if (!player) return;
    player.seekTo((player.getCurrentTime?.() || 0) + SKIP_SEC, true);
  }

  return (
    <div className="space-y-2">
      <div className={VIDEO_FRAME} style={VIDEO_FRAME_STYLE}>
        {/* The iframe container is always rendered: never hidden, never display:none */}
        <div
          ref={containerRef}
          style={VIDEO_PLAYER_STYLE}
          className="[&_iframe]:w-full [&_iframe]:h-full [&_iframe]:block"
        />
        <div className="absolute inset-x-0 top-0 h-1 bg-white/10">
          <div className="h-full bg-gradient-to-r from-violet-400 to-blue-400 shadow-[0_0_6px_rgba(139,92,246,0.36)] transition-[width]" style={{ width: `${progress}%` }} />
        </div>
        {children}
      </div>
      <div className="flex items-center justify-between text-sm px-1">
        <div className="min-w-0">
          <p dir="auto" className="truncate">
            {video.title}
          </p>
          <p className="text-xs text-slate-500 truncate">
            {video.channel} · {video.topic}
          </p>
        </div>
        <button onClick={skip} className="shrink-0 text-slate-500 hover:text-slate-300 text-xs">
          {t.skipSeconds(SKIP_SEC)}
        </button>
      </div>
    </div>
  );
}
