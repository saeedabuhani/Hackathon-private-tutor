"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import useStore from "@/store/useStore";
import useFeed from "@/hooks/useFeed";
import { detectLanguage } from "@/lib/utils";
import { useTranslation } from "@/lib/translations";
import VideoFeed from "@/components/feed/VideoFeed";
import VideoControls from "@/components/feed/VideoControls";
import VideoSidebar from "@/components/feed/VideoSidebar";
import FeedSyncBanner from "@/components/feed/FeedSyncBanner";
import QuickQuestion from "@/components/feed/QuickQuestion";
import { VIDEO_LAYOUT } from "@/lib/videoFrame";

// The video language tabs are written in each language's own script on purpose
const LANG_TABS = [
  { code: "he", label: "עברית" },
  { code: "ar", label: "العربية" },
  { code: "en", label: "English" },
];
const WATCH_XP = 10;
const QUIZ_XP = 5;

export default function FeedPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useStore((s) => s.user);
  const activeTopic = useStore((s) => s.activeTopic);
  const activeLanguage = useStore((s) => s.activeLanguage);
  const activeMaterialId = useStore((s) => s.activeMaterialId);
  const setXP = useStore((s) => s.setXP);

  const { videos, loading, error, synced, dismissSync } = useFeed(activeTopic);
  const [lang, setLang] = useState(activeLanguage);
  const [currentId, setCurrentId] = useState(null);
  const [watchedIds, setWatchedIds] = useState(() => new Set());
  const [quizVideo, setQuizVideo] = useState(null);
  const [failedIds, setFailedIds] = useState(() => new Set());
  const [notice, setNotice] = useState(""); // a translation key, so it follows the site language

  const langVideos = videos.filter((v) => v.lang === lang && !failedIds.has(v.id));
  const index = Math.max(0, langVideos.findIndex((v) => v.id === currentId));
  const current = langVideos[index];

  useEffect(() => {
    console.log("currentVideo", current);
  }, [current]);

  // New topic or language tab: start from the first video
  useEffect(() => {
    setCurrentId(langVideos[0]?.id ?? null);
    setQuizVideo(null);
    setNotice("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videos, lang]);

  const awardXP = useCallback(
    async (points, reason) => {
      if (!user?.id) return;
      try {
        const res = await fetch("/api/xp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, points, reason }),
        });
        const data = await res.json();
        if (res.ok) setXP(data.newTotal);
      } catch {
        // XP is a bonus; never block the feed on it
      }
    },
    [user?.id, setXP]
  );

  // Once per video: XP + quick question
  const markWatched = useCallback(
    (video, { withQuiz }) => {
      if (!video || watchedIds.has(video.id)) return;
      setWatchedIds((prev) => new Set(prev).add(video.id));
      awardXP(WATCH_XP, `watched: ${video.title}`);
      if (withQuiz) setQuizVideo(video);
    },
    [watchedIds, awardXP]
  );

  const go = useCallback(
    (delta) => {
      const next = langVideos[index + delta];
      if (next) {
        setQuizVideo(null);
        setCurrentId(next.id);
      }
    },
    [langVideos, index]
  );

  // Drop a video from the feed and move on (used for playback errors and the Skip button)
  const removeVideo = useCallback(
    (video, noticeKey) => {
      if (!video) return;
      const next = langVideos[index + 1] ?? langVideos[index - 1];
      setFailedIds((prev) => new Set(prev).add(video.id));
      setQuizVideo(null);
      setCurrentId(next?.id ?? null);
      setNotice(noticeKey);
    },
    [langVideos, index]
  );

  function onQuizDone(correct) {
    if (correct) awardXP(QUIZ_XP, "quick question");
    setQuizVideo(null);
    if (langVideos[index + 1]) go(1);
  }

  function learnDeeper() {
    const topic = encodeURIComponent(activeTopic);
    router.push(activeMaterialId ? `/tutor/${activeMaterialId}?topic=${topic}` : "/tutor");
  }

  if (!activeTopic) {
    return (
      <div className="max-w-md mx-auto p-8 text-center space-y-3">
        <h1 className="text-xl font-bold">{t.studyFeed}</h1>
        <p className="text-slate-400">{t.feedEmpty}</p>
        <Link
          href="/tutor"
          className="inline-block rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 font-medium"
        >
          {t.goToTutor}
        </Link>
      </div>
    );
  }

  const titleRtl = current ? ["he", "ar"].includes(detectLanguage(current.title)) : false;

  return (
    <div className="max-w-7xl mx-auto px-2 py-3 sm:px-4 space-y-3">
      {synced && <FeedSyncBanner topic={activeTopic} onDismiss={dismissSync} />}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          {LANG_TABS.map((tab) => (
            <button
              key={tab.code}
              onClick={() => setLang(tab.code)}
              className={`rounded-full px-4 py-1.5 text-sm ${
                lang === tab.code ? "bg-indigo-600 text-white" : "bg-slate-800 hover:bg-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={learnDeeper}
          className="rounded-full bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-1.5 text-sm font-medium"
        >
          🧠 {t.learnDeeper}: <bdi>{activeTopic}</bdi>
        </button>
      </div>

      {loading && (
        <p className="text-slate-400 text-center py-10">
          {t.findingVideos} <bdi>{activeTopic}</bdi>...
        </p>
      )}
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {notice && (
        <p className="text-amber-400 text-sm" role="status">
          {t[notice]}
        </p>
      )}

      {!loading && !error && videos.length > 0 && (
        // [ video: whole center, 75vh ][ sidebar 260px ]; stacked on small screens
        <div className={VIDEO_LAYOUT}>
          <div className="space-y-3 min-w-0">
            {current ? (
              <>
                <VideoFeed
                  key={current.id}
                  video={current}
                  onEnded={() => markWatched(current, { withQuiz: true })}
                  onError={() => removeVideo(current, "videoUnplayable")}
                >
                  {quizVideo && <QuickQuestion video={quizVideo} onDone={onQuizDone} />}
                </VideoFeed>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={current.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    dir={titleRtl ? "rtl" : "ltr"}
                    className="text-sm font-medium text-slate-200 text-center"
                  >
                    {current.title}
                  </motion.p>
                </AnimatePresence>
                <VideoControls
                  onPrev={() => go(-1)}
                  onNext={() => go(1)}
                  hasPrev={index > 0}
                  hasNext={index < langVideos.length - 1}
                  watched={watchedIds.has(current.id)}
                  onMarkWatched={() => markWatched(current, { withQuiz: true })}
                  onSkip={() => removeVideo(current, "videoSkipped")}
                  xpReward={WATCH_XP}
                />
              </>
            ) : (
              <p className="text-slate-500 text-center py-10">{t.noVideosLang}</p>
            )}
          </div>

          <aside>
            <h2 className="text-sm text-slate-400 mb-2">
              {t.moreAbout} <bdi>{activeTopic}</bdi>
            </h2>
            <VideoSidebar
              videos={langVideos}
              currentId={current?.id}
              watchedIds={watchedIds}
              onSelect={(id) => {
                setQuizVideo(null);
                setCurrentId(id);
              }}
            />
          </aside>
        </div>
      )}
    </div>
  );
}
