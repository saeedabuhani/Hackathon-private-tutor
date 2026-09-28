"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import useStore from "@/store/useStore";
import { useTranslation } from "@/lib/translations";
import AiVideoPlayer from "@/components/ai-studies/AiVideoPlayer";
import VideoSidebar from "@/components/feed/VideoSidebar";
import { VIDEO_LAYOUT } from "@/lib/videoFrame";

const WATCH_XP = 5; // watching a video to the end is all there is to earn here (no quiz)

// 75 -> "1:15"
function formatSeconds(sec) {
  if (!Number.isFinite(sec) || sec <= 0) return "";
  return `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, "0")}`;
}

export default function AiStudiesPage() {
  const { t } = useTranslation();
  const user = useStore((s) => s.user);
  const setXP = useStore((s) => s.setXP);

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [topic, setTopic] = useState("all");
  const [index, setIndex] = useState(0);
  const [xpNote, setXpNote] = useState("");
  const [watchedIds, setWatchedIds] = useState(() => new Set());
  const rewardedRef = useRef(new Set()); // one XP reward per video per session

  useEffect(() => {
    fetch("/api/ai-videos")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load videos");
        setVideos(data.videos);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const topics = useMemo(() => [...new Set(videos.map((v) => v.topic).filter(Boolean))], [videos]);
  const visible = useMemo(
    () => (topic === "all" ? videos : videos.filter((v) => v.topic === topic)),
    [videos, topic]
  );
  const current = visible[index];

  useEffect(() => {
    console.log("currentVideo", current);
  }, [current]);

  // The sidebar list uses the same shape as the StudyFeed one
  const sidebarVideos = useMemo(
    () =>
      visible.map((v) => ({
        id: v.id,
        title: v.title,
        thumbnail: v.thumbnailUrl,
        channel: v.topic,
        duration: formatSeconds(v.durationSec),
      })),
    [visible]
  );

  const go = useCallback(
    (delta) => {
      setXpNote("");
      setIndex((i) => Math.min(Math.max(i + delta, 0), visible.length - 1));
    },
    [visible.length]
  );

  // Arrow up/down move between videos
  useEffect(() => {
    function onKey(e) {
      if (e.key === "ArrowUp") go(-1);
      if (e.key === "ArrowDown") go(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  async function handleEnded() {
    if (!current || rewardedRef.current.has(current.id) || !user?.id) return;
    rewardedRef.current.add(current.id);
    setWatchedIds((prev) => new Set(prev).add(current.id));
    try {
      const res = await fetch("/api/xp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, points: WATCH_XP, reason: `ai-studies: ${current.title}` }),
      });
      const data = await res.json();
      if (res.ok) {
        setXP(data.newTotal);
        setXpNote(t.xpGain(WATCH_XP));
      }
    } catch {
      // XP is a bonus; never block the feed on it
    }
  }

  function pickTopic(next) {
    setTopic(next);
    setIndex(0);
    setXpNote("");
  }

  return (
    <div className="max-w-7xl mx-auto px-2 py-3 sm:px-4 space-y-3">
      <div className="flex items-center justify-between text-sm text-slate-400">
        <h1 className="text-neon text-2xl font-extrabold">🤖 {t.aiStudies}</h1>
        {visible.length > 0 && (
          <span dir="ltr">
            {index + 1} / {visible.length}
          </span>
        )}
      </div>

      {topics.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {["all", ...topics].map((tp) => (
            <button
              key={tp}
              onClick={() => pickTopic(tp)}
              className={`rounded-full px-3 py-1 text-xs ${
                topic === tp ? "bg-indigo-600 text-white" : "bg-slate-800 hover:bg-slate-700"
              }`}
            >
              {tp === "all" ? t.all : <bdi>{tp}</bdi>}
            </button>
          ))}
        </div>
      )}

      {loading && <p className="text-center text-slate-500 py-16">{t.loadingVideos}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
      {!loading && !error && videos.length === 0 && (
        <p className="text-center text-slate-400 py-16">{t.noAiVideos}</p>
      )}

      {current && (
        // [ video: whole center, 75vh ][ sidebar 260px ]; stacked on small screens
        <div className={VIDEO_LAYOUT}>
          <div className="space-y-3 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                <AiVideoPlayer video={current} onEnded={handleEnded} />
                <div dir="auto" className="px-1">
                  <p className="text-sm">{current.title}</p>
                  {current.description && (
                    <p className="text-xs text-slate-500 line-clamp-2">{current.description}</p>
                  )}
                  {current.topic && <p className="text-xs text-slate-500">{current.topic}</p>}
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => go(-1)}
                disabled={index === 0}
                className="rounded-full bg-slate-800 hover:bg-slate-700 disabled:opacity-30 px-4 py-2 text-sm"
              >
                ↑ {t.prevVideo}
              </button>
              <span className="min-w-16 text-center text-sm text-amber-400">{xpNote}</span>
              <button
                onClick={() => go(1)}
                disabled={index >= visible.length - 1}
                className="rounded-full bg-slate-800 hover:bg-slate-700 disabled:opacity-30 px-4 py-2 text-sm"
              >
                {t.nextVideo} ↓
              </button>
            </div>
          </div>

          <aside>
            <h2 className="text-sm text-slate-400 mb-2">{t.videosInList}</h2>
            <VideoSidebar
              videos={sidebarVideos}
              currentId={current.id}
              watchedIds={watchedIds}
              onSelect={(id) => {
                setXpNote("");
                setIndex(Math.max(0, visible.findIndex((v) => v.id === id)));
              }}
            />
          </aside>
        </div>
      )}
    </div>
  );
}
