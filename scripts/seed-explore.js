// Fills explore_videos with short (<=60s), embeddable YouTube videos.
// Run: node scripts/seed-explore.js
//
// Standalone CommonJS on purpose: the rest of the app is ES modules (transpiled
// by Next), but this script runs under plain `node`, so it does not import
// from lib/* and instead duplicates the handful of small helpers it needs.

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const API = "https://www.googleapis.com/youtube/v3";
const MAX_DURATION_SEC = 60;
const PER_TOPIC = 10;
const REGION = "IL";

const topics = [
  { name: "JavaScript", queries: ["javascript explained in 60 seconds animated", "javascript tutorial short animation", "javascript for beginners quick"] },
  { name: "React", queries: ["react explained in 60 seconds animated", "react tutorial short animation", "react for beginners quick"] },
  { name: "CSS", queries: ["css explained in 60 seconds animated", "css tutorial short animation", "css for beginners quick"] },
  { name: "Git", queries: ["git explained in 60 seconds animated", "git tutorial short animation", "git for beginners quick"] },
  { name: "API", queries: ["api explained in 60 seconds animated", "rest api tutorial short animation", "api for beginners quick"] },
  { name: "Database", queries: ["database explained in 60 seconds animated", "database tutorial short animation", "database for beginners quick"] },
  { name: "Node.js", queries: ["nodejs explained in 60 seconds animated", "node js tutorial short animation", "nodejs for beginners quick"] },
  { name: "HTML", queries: ["html explained in 60 seconds animated", "html tutorial short animation", "html for beginners quick"] },
  { name: "Python", queries: ["python explained in 60 seconds animated", "python tutorial short animation", "python for beginners quick"] },
  { name: "TypeScript", queries: ["typescript explained in 60 seconds animated", "typescript tutorial short animation", "typescript for beginners quick"] },
  { name: "Docker", queries: ["docker explained in 60 seconds animated", "docker tutorial short animation", "docker for beginners quick"] },
  { name: "SQL", queries: ["sql explained in 60 seconds animated", "sql tutorial short animation", "sql for beginners quick"] },
];

function loadEnvLocal() {
  const file = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

function durationToSeconds(iso = "") {
  const m = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!m) return null;
  return Number(m[1] || 0) * 3600 + Number(m[2] || 0) * 60 + Number(m[3] || 0);
}

function isUsable(video, durationSec) {
  if (durationSec === null || durationSec === 0 || durationSec > MAX_DURATION_SEC) return false;
  if (video.status?.embeddable !== true) return false;
  if (video.status?.privacyStatus !== "public") return false;
  if (video.contentDetails?.contentRating?.ytRating === "ytAgeRestricted") return false;
  const region = video.contentDetails?.regionRestriction;
  if (region?.blocked?.includes(REGION)) return false;
  if (region?.allowed && !region.allowed.includes(REGION)) return false;
  return true;
}

async function youtubeGet(key, endpoint, params) {
  const url = `${API}/${endpoint}?${new URLSearchParams({ ...params, key })}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `YouTube API error (${res.status})`);
  return data;
}

async function searchIds(key, query) {
  const data = await youtubeGet(key, "search", {
    part: "snippet",
    type: "video",
    maxResults: "25",
    order: "relevance",
    q: query,
    videoDuration: "short", // YouTube's own filter: under 4 minutes; we filter to <=60s below
    videoEmbeddable: "true",
    videoDefinition: "high",
    regionCode: REGION,
    safeSearch: "strict",
  });
  return (data.items || []).map((i) => i.id.videoId).filter(Boolean);
}

async function fetchDetails(key, ids) {
  const items = [];
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    const data = await youtubeGet(key, "videos", {
      part: "snippet,contentDetails,status",
      id: batch.join(","),
    });
    items.push(...(data.items || []));
  }
  return items;
}

// The same generic "explained in 60 seconds" video often ranks for several
// topics' searches. `claimed` is shared across topics so each video is saved
// under only the first topic that finds it, instead of the last one via upsert.
async function seedTopic(key, admin, topic, claimed) {
  const idSet = new Set();
  for (const query of topic.queries) {
    for (const id of await searchIds(key, query)) {
      if (!claimed.has(id)) idSet.add(id);
    }
  }
  if (idSet.size === 0) {
    console.log(`  ${topic.name}: no new search results`);
    return 0;
  }

  const details = await fetchDetails(key, [...idSet]);
  const rows = [];
  for (const v of details) {
    const durationSec = durationToSeconds(v.contentDetails?.duration);
    if (!isUsable(v, durationSec)) continue;
    claimed.add(v.id);
    rows.push({
      youtube_id: v.id,
      title: v.snippet.title,
      topic: topic.name,
      language: "en",
      duration_sec: durationSec,
      difficulty: "beginner",
      thumbnail: v.snippet.thumbnails?.medium?.url || v.snippet.thumbnails?.default?.url || "",
      channel: v.snippet.channelTitle,
    });
    if (rows.length >= PER_TOPIC) break;
  }

  if (rows.length === 0) {
    console.log(`  ${topic.name}: found videos, but none were <=60s and embeddable`);
    return 0;
  }

  // Unique on youtube_id, so re-running the script is safe
  const { error } = await admin
    .from("explore_videos")
    .upsert(rows, { onConflict: "youtube_id", ignoreDuplicates: true });
  if (error) throw new Error(`${topic.name}: ${error.message}`);
  console.log(`  ${topic.name}: saved ${rows.length} videos`);
  return rows.length;
}

async function main() {
  loadEnvLocal();
  const youtubeKey = process.env.YOUTUBE_API_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!youtubeKey) throw new Error("YOUTUBE_API_KEY is not set in .env.local");
  if (!url || !serviceKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set in .env.local");
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  console.log(`Seeding ${topics.length} topics (search.list costs ~${topics.length * topics[0].queries.length * 100} quota units)...`);

  // Videos already in the catalog from a previous run also count as claimed,
  // so a fresh topic never steals a video already saved under another topic.
  const claimed = new Set();
  const { data: existing } = await admin.from("explore_videos").select("youtube_id");
  for (const row of existing || []) claimed.add(row.youtube_id);

  let total = 0;
  for (const topic of topics) {
    total += await seedTopic(youtubeKey, admin, topic, claimed);
  }
  console.log(`Done. ${total} videos saved across ${topics.length} topics.`);
}

main().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
