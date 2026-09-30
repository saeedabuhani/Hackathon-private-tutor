"use client";

import { useEffect, useRef, useState } from "react";
import { loadYouTubeApi } from "@/lib/youtubePlayer";
import "@/components/feed/video-ui.css";
import { VIDEO_FRAME, VIDEO_FRAME_STYLE, VIDEO_PLAYER_STYLE } from "@/lib/videoFrame";
import { useTranslation } from "@/lib/translations";

// Vertical (9:16) player for one AI Studies video. Plays either a YouTube embed
// (video.youtubeId) or a direct file (video.videoUrl). No quiz — it only reports
// when the video ends. Render with key={video.id} so each video gets a fresh player.
export default function AiVideoPlayer({ video, onEnded }) {
  const { t } = useTranslation();
  const containerRef = useRef(null);
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;
  const [failed, setFailed] = useState(false);
  // A portrait file fills the frame (cover). A landscape one is letterboxed instead, because
  // cover would crop away about two thirds of the picture (code, slides, faces).
  const [fit, setFit] = useState("object-contain");

  useEffect(() => {
    if (!video.youtubeId) return;
    let cancelled = false;
    let player = null;
    const container = containerRef.current;

    loadYouTubeApi().then((YT) => {
      if (cancelled || !container) return;
      const mount = document.createElement("div");
      container.appendChild(mount);
      player = new YT.Player(mount, {
        width: "100%",
        height: "100%",
        videoId: video.youtubeId,
        playerVars: { autoplay: 1, rel: 0, playsinline: 1, modestbranding: 1, origin: window.location.origin },
        events: {
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.ENDED) onEndedRef.current?.();
          },
          onError: () => setFailed(true),
        },
      });
    });

    return () => {
      cancelled = true;
      player?.destroy?.();
      if (container) container.innerHTML = "";
    };
  }, [video.youtubeId]);

  return (
    <div className={VIDEO_FRAME} style={VIDEO_FRAME_STYLE}>
      {video.youtubeId ? (
        <div
          ref={containerRef}
          style={VIDEO_PLAYER_STYLE}
          className="[&_iframe]:w-full [&_iframe]:h-full [&_iframe]:block"
        />
      ) : (
        <video
          src={video.videoUrl}
          poster={video.thumbnailUrl || undefined}
          style={VIDEO_PLAYER_STYLE}
          className={fit}
          controls
          autoPlay
          playsInline
          onLoadedMetadata={(e) => {
            const { videoWidth: w, videoHeight: h } = e.currentTarget;
            if (w && h && h >= w * 1.2) setFit("object-cover");
          }}
          onEnded={() => onEndedRef.current?.()}
          onError={() => setFailed(true)}
        />
      )}

      <span className="research-label pointer-events-none absolute start-3 top-3 z-10">
        <i aria-hidden="true" className="research-led" />
        <span>{t.aiGenerated}</span>
        <span className="research-id" dir="ltr" aria-hidden="true">
          SPEC-{String(video.id ?? "").replace(/\W/g, "").slice(-4).toUpperCase().padStart(4, "0")}
        </span>
      </span>

      {failed && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-slate-950 p-6 text-center">
          <p className="text-3xl">⚠️</p>
          <p className="text-sm text-slate-300">{t.aiCantPlay}</p>
        </div>
      )}
    </div>
  );
}
