import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server";

export const runtime = "nodejs";

// GET /api/explore/videos?topic=&lang=&exclude=ytId1,ytId2
// Returns one random video the caller hasn't seen this session.
// topic omitted -> random topic. lang omitted -> defaults to 'en' (how the catalog is seeded).
export async function GET(request) {
  try {
    const params = new URL(request.url).searchParams;
    const topic = params.get("topic")?.trim();
    const lang = params.get("lang")?.trim() || "en";
    const exclude = (params.get("exclude") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const admin = requireAdmin();
    let query = admin.from("explore_videos").select("*").eq("language", lang);
    if (topic) query = query.eq("topic", topic);
    if (exclude.length > 0) query = query.not("youtube_id", "in", `(${exclude.join(",")})`);

    // Small candidate pool so "random" doesn't need a DB-side RANDOM() call
    const { data: candidates, error } = await query.limit(30);
    if (error) throw new Error(error.message);

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ video: null, message: "You've watched everything! Come back tomorrow 🎉" });
    }

    const video = candidates[Math.floor(Math.random() * candidates.length)];

    // Best-effort view counter; never fails the request
    admin
      .from("explore_videos")
      .update({ times_shown: (video.times_shown || 0) + 1 })
      .eq("id", video.id)
      .then(() => {}, () => {});

    return NextResponse.json({
      video: {
        id: video.id,
        youtubeId: video.youtube_id,
        title: video.title,
        topic: video.topic,
        subtopic: video.subtopic,
        language: video.language,
        durationSec: video.duration_sec,
        thumbnail: video.thumbnail,
        channel: video.channel,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
