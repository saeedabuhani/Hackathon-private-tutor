import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server";

export const runtime = "nodejs";

// GET /api/ai-videos?topic=&lang=  ->  { videos: [...] } ordered by order_index
export async function GET(request) {
  try {
    const params = new URL(request.url).searchParams;
    const topic = params.get("topic")?.trim();
    const lang = params.get("lang")?.trim();

    const admin = requireAdmin();
    let query = admin
      .from("ai_videos")
      .select("*")
      .order("order_index", { ascending: true })
      .order("created_at", { ascending: true });
    if (topic) query = query.eq("topic", topic);
    if (lang) query = query.eq("language", lang);

    const { data, error } = await query;
    if (error) {
      const missingTable = error.code === "PGRST205" || /ai_videos/.test(error.message);
      throw new Error(
        missingTable
          ? "The ai_videos table doesn't exist yet — run supabase/add-ai-videos.sql in the Supabase SQL Editor."
          : error.message
      );
    }

    const videos = data.map((v) => ({
      id: v.id,
      title: v.title,
      description: v.description,
      topic: v.topic,
      youtubeId: v.youtube_id,
      videoUrl: v.video_url,
      thumbnailUrl: v.thumbnail_url,
      durationSec: v.duration_sec,
      language: v.language,
      orderIndex: v.order_index,
    }));
    return NextResponse.json({ videos });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
