const API = "https://www.googleapis.com/youtube/v3";
const CACHE_TTL_MS = 60 * 60 * 1000;

// search.list costs 100 quota units, so cache per topic + language
const cache = new Map();

export const FEED_LANGS = ["he", "ar", "en"];

export function buildQuery(topic, lang) {
  const queries = {
    he: `${topic} JavaScript הסבר עברית`,
    ar: `شرح ${topic} جافاسكريبت`,
    en: `${topic} JavaScript tutorial explained simply`,
  };
  return queries[lang] || queries.en;
}

// "PT1H2M30S" -> "1:02:30", "PT4M5S" -> "4:05"
export function formatDuration(iso = "") {
  const m = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!m) return "";
  const [h, min, s] = [Number(m[1] || 0), Number(m[2] || 0), Number(m[3] || 0)];
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${String(min).padStart(2, "0")}:${ss}` : `${min}:${ss}`;
}

// Region used to drop videos that are geo-blocked for the viewer
const REGION = (process.env.YOUTUBE_REGION || "IL").trim().toUpperCase();

// A video can be public and "embeddable" and still fail in an iframe
// (age restricted, blocked in the viewer's region), so check all of it.
export function isPlayableInIframe(v) {
  if (v.status?.embeddable !== true) return false;
  if (v.status?.privacyStatus !== "public") return false;
  if (v.contentDetails?.contentRating?.ytRating === "ytAgeRestricted") return false;
  const region = v.contentDetails?.regionRestriction;
  if (region?.blocked?.includes(REGION)) return false;
  if (region?.allowed && !region.allowed.includes(REGION)) return false;
  return true;
}

async function youtubeGet(path, params) {
  const key = process.env.YOUTUBE_API_KEY?.trim();
  if (!key) throw new Error("YOUTUBE_API_KEY is not set");
  const url = `${API}/${path}?${new URLSearchParams({ ...params, key })}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || `YouTube API error (${res.status})`);
  }
  return data;
}

export async function searchVideos(topic, lang, limit = 3) {
  const cacheKey = `${lang}|${limit}|${topic.toLowerCase()}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.videos;

  const search = await youtubeGet("search", {
    part: "snippet",
    type: "video",
    // Ask for a few extra: some are dropped below if they turn out not to be embeddable
    maxResults: String(limit + 3),
    q: buildQuery(topic, lang),
    relevanceLanguage: lang,
    regionCode: REGION,
    videoEmbeddable: "true",
    safeSearch: "strict",
  });

  const ids = (search.items || []).map((i) => i.id.videoId).filter(Boolean);
  if (ids.length === 0) return [];

  // Second call for durations + embeddable status (1 quota unit).
  // videoEmbeddable on search is not always accurate, so re-check `status.embeddable`.
  const details = await youtubeGet("videos", {
    part: "contentDetails,snippet,status",
    id: ids.join(","),
  });

  const usable = (details.items || []).filter(isPlayableInIframe);

  const videos = usable.slice(0, limit).map((v) => ({
    id: v.id,
    title: v.snippet.title,
    channel: v.snippet.channelTitle,
    description: (v.snippet.description || "").slice(0, 500),
    duration: formatDuration(v.contentDetails?.duration),
    thumbnail:
      v.snippet.thumbnails?.medium?.url || v.snippet.thumbnails?.default?.url || "",
    lang,
  }));

  cache.set(cacheKey, { at: Date.now(), videos });
  return videos;
}
