"use client";

import { useEffect, useRef, useState } from "react";
import { loadYouTubeApi } from "@/lib/youtubePlayer";
import { VIDEO_FRAME, VIDEO_FRAME_STYLE, VIDEO_PLAYER_STYLE } from "@/lib/videoFrame";
import { useTranslation } from "@/lib/translations";

const SKIP_DELAY_MS = 2000; // how long the error message shows before moving on
const START_TIMEOUT_MS = 10000; // Play was clicked but nothing started -> treat as broken

// Vertical (9:16) player. Shows a poster with a custom Play button first, so the
// iframe is only touched after a deliberate click. If the video can't play,
// a cover replaces the iframe (hiding YouTube's error/Help UI) and onError
// fires after 2 seconds so the parent can move to the next video.
// Render with key={video.id} so each video gets a fresh player.
export default function VideoFeed({ video, onEnded, onError, children }) {
  const { t } = useTranslation();
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const wantsPlayRef = useRef(false);
  const startTimerRef = useRef(null);
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  // 'idle' (poster) | 'loading' | 'playing' | 'error'
  const [status, setStatus] = useState("idle");
  const videoId = video.id;

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;

    loadYouTubeApi().then((YT) => {
      if (cancelled || !container) return;
      const mount = document.createElement("div");
      container.appendChild(mount);
      playerRef.current = new YT.Player(mount, {
        width: "100%",
        height: "100%",
        videoId,
        playerVars: {
          rel: 0,
          playsinline: 1,
          modestbranding: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            if (wantsPlayRef.current) playerRef.current?.playVideo();
          },
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.PLAYING || e.data === YT.PlayerState.BUFFERING) {
              clearTimeout(startTimerRef.current);
              setStatus("playing");
            }
            if (e.data === YT.PlayerState.ENDED) onEndedRef.current?.();
          },
          // 2 bad id, 5 player error, 100 removed/private, 101/150 embedding disabled
          onError: () => {
            clearTimeout(startTimerRef.current);
            setStatus("error");
          },
        },
      });
    });

    return () => {
      cancelled = true;
      clearTimeout(startTimerRef.current);
      playerRef.current?.destroy?.();
      playerRef.current = null;
      if (container) container.innerHTML = "";
    };
  }, [videoId]);

  // After an error: show the message for 2s, then let the parent skip this video
  useEffect(() => {
    if (status !== "error") return;
    const timer = setTimeout(() => onErrorRef.current?.(), SKIP_DELAY_MS);
    return () => clearTimeout(timer);
  }, [status]);

  function handlePlay() {
    wantsPlayRef.current = true;
    setStatus("loading");
    // Nothing started (e.g. generic "An error occurred" without an error event)
    startTimerRef.current = setTimeout(() => setStatus("error"), START_TIMEOUT_MS);
    playerRef.current?.playVideo?.();
  }

  return (
    <div className={VIDEO_FRAME} style={VIDEO_FRAME_STYLE}>
      {/* The iframe container is always rendered: never hidden, never display:none */}
      <div
        ref={containerRef}
        style={VIDEO_PLAYER_STYLE}
        className="[&_iframe]:w-full [&_iframe]:h-full [&_iframe]:block"
      />

      {(status === "idle" || status === "loading") && (
        <button
          type="button"
          onClick={handlePlay}
          disabled={status === "loading"}
          className="absolute inset-0 z-10 flex items-center justify-center bg-black"
          aria-label={t.playVideo}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={video.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-70"
          />
          <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-blue-500 text-2xl text-white shadow-[0_0_34px_rgba(139,92,246,0.85)] transition hover:scale-110">
            {status === "loading" ? "…" : "▶"}
          </span>
        </button>
      )}

      {status === "error" && (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-slate-950 p-6 text-center"
          role="status"
        >
          <p className="text-3xl">⚠️</p>
          <p className="text-sm text-slate-300">{t.cantPlayMoving}</p>
        </div>
      )}

      {children}
    </div>
  );
}
