"use client";

import { useEffect, useState } from "react";

// Survives tab switches (the Feed page remounts every time)
const cache = new Map();
let lastLoadedTopic = null;

// Fetches videos (he/ar/en) whenever the shared activeTopic changes.
// `synced` is true when this topic is new to the feed, i.e. it came from the Tutor.
export default function useFeed(topic) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    if (!topic) {
      setVideos([]);
      return;
    }

    const isNewTopic = lastLoadedTopic !== topic;
    lastLoadedTopic = topic;
    setSynced(isNewTopic);
    setError("");

    if (cache.has(topic)) {
      setVideos(cache.get(topic));
      return;
    }

    let cancelled = false;
    setLoading(true);
    setVideos([]);
    fetch(`/api/feed?topic=${encodeURIComponent(topic)}&lang=all&limit=3`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load videos");
        return data.videos;
      })
      .then((list) => {
        if (cancelled) return;
        cache.set(topic, list);
        setVideos(list);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [topic]);

  return { videos, loading, error, synced, dismissSync: () => setSynced(false) };
}
