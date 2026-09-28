"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import useStore from "@/store/useStore";
import { useTranslation } from "@/lib/translations";
import ExploreVideo from "@/components/explore/ExploreVideo";
import ExploreQuestion from "@/components/explore/ExploreQuestion";
import ExploreExplain from "@/components/explore/ExploreExplain";
import { VIDEO_LAYOUT } from "@/lib/videoFrame";

// 'video' -> 'question' (loading or ready) -> 'wrong' (explanation) -> back to 'video'
export default function ExplorePage() {
  const { t, lang } = useTranslation(); // the quiz is written in the site language
  const user = useStore((s) => s.user);
  const setXP = useStore((s) => s.setXP);

  const [video, setVideo] = useState(null);
  const [phase, setPhase] = useState("loading"); // loading | video | question | wrong | empty | error
  const [quiz, setQuiz] = useState(null);
  const [explanation, setExplanation] = useState("");
  const [watchedCount, setWatchedCount] = useState(0);
  const [sessionVideos, setSessionVideos] = useState([]); // for the sidebar: what you've seen
  const [error, setError] = useState("");
  const seenRef = useRef([]); // youtube_ids shown this session

  const loadVideo = useCallback(async (topic) => {
    setPhase("loading");
    setError("");
    try {
      const qs = new URLSearchParams();
      if (topic) qs.set("topic", topic);
      if (seenRef.current.length) qs.set("exclude", seenRef.current.join(","));
      const res = await fetch(`/api/explore/videos?${qs}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load a video");
      if (!data.video) {
        setPhase("empty");
        return;
      }
      seenRef.current = [...seenRef.current, data.video.youtubeId];
      setSessionVideos((prev) => [{ ...data.video, result: null }, ...prev]);
      setVideo(data.video);
      setQuiz(null);
      setPhase("video");
    } catch (err) {
      setError(err.message);
      setPhase("error");
    }
  }, []);

  useEffect(() => {
    loadVideo(null);
  }, [loadVideo]);

  function markResult(youtubeId, result) {
    setSessionVideos((prev) => prev.map((v) => (v.youtubeId === youtubeId ? { ...v, result } : v)));
  }

  async function askQuestion() {
    setPhase("question");
    try {
      const res = await fetch("/api/explore/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoTitle: video.title, topic: video.topic, lang }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load a question");
      setQuiz(data);
      setWatchedCount((n) => n + 1);
    } catch {
      // No question this time — just move on, don't block the feed
      afterAnswer(true, video.topic);
    }
  }

  async function submitAnswer(isCorrect, correctAnswerText) {
    markResult(video.youtubeId, isCorrect ? "correct" : "wrong");
    try {
      const res = await fetch("/api/explore/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: video.id,
          userId: user?.id,
          topic: video.topic,
          isCorrect,
          lang,
          question: quiz.question,
          correctAnswerText,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save your answer");

      if (isCorrect) {
        if (typeof data.newTotal === "number") setXP(data.newTotal);
        afterAnswer(true, data.nextTopic);
      } else {
        setExplanation(data.explanation || "");
        setPhase("wrong");
      }
    } catch (err) {
      setError(err.message);
      afterAnswer(isCorrect, video.topic);
    }
  }

  function afterAnswer(wasCorrect, nextTopic) {
    setTimeout(() => loadVideo(nextTopic), wasCorrect ? 900 : 0);
  }

  const showPlayer = video && phase !== "loading" && phase !== "empty";

  useEffect(() => {
    console.log("currentVideo", video);
  }, [video]);

  return (
    <div className="max-w-7xl mx-auto px-2 py-3 sm:px-4 space-y-3">
      <div className="flex items-center justify-between text-sm text-slate-400">
        <h1 className="text-neon text-2xl font-extrabold">🎬 {t.explore}</h1>
        <span>{t.videosToday(watchedCount)}</span>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {phase === "loading" && <p className="text-center text-slate-500 py-16">{t.loadingVideo}</p>}

      {phase === "empty" && (
        <p className="text-center text-slate-400 py-16">{t.watchedEverything}</p>
      )}

      {showPlayer && (
        // [ video: whole center, 75vh ][ sidebar 260px ]; stacked on small screens
        <div className={VIDEO_LAYOUT}>
          <AnimatePresence mode="wait">
            <motion.div
              className="min-w-0"
              key={video.youtubeId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ExploreVideo video={video} onTrigger={askQuestion}>
                {phase === "question" && quiz && (
                  <ExploreQuestion quiz={quiz} onAnswer={submitAnswer} />
                )}
                {phase === "question" && !quiz && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/95">
                    <p className="text-slate-400 text-sm">{t.preparingQuestion}</p>
                  </div>
                )}
                {phase === "wrong" && (
                  <ExploreExplain
                    explanation={explanation}
                    onContinue={() => afterAnswer(false, video.topic)}
                  />
                )}
              </ExploreVideo>
            </motion.div>
          </AnimatePresence>

          <aside>
            <h2 className="text-sm text-slate-400 mb-2">{t.thisSession}</h2>
            {sessionVideos.length === 0 ? (
              <p className="text-sm text-slate-500">{t.noSessionVideos}</p>
            ) : (
              <ul className="space-y-2">
                {sessionVideos.map((v) => (
                  <li
                    key={v.youtubeId}
                    className={`flex gap-3 rounded-2xl p-2.5 ${
                      v.youtubeId === video.youtubeId
                        ? "bg-indigo-950 border border-indigo-600"
                        : "bg-slate-900 border border-slate-800"
                    }`}
                  >
                    {v.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={v.thumbnail} alt="" className="w-24 h-14 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-24 h-14 rounded-xl bg-slate-800 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p dir="auto" className="text-sm line-clamp-2">
                        {v.title}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {v.topic}
                        {v.result === "correct" && " · ✅"}
                        {v.result === "wrong" && " · ❌"}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
