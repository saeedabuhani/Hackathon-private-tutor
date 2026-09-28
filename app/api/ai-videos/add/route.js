import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { requireAdmin } from "@/lib/server";

export const runtime = "nodejs";

const LANGS = ["he", "ar", "en"];

function isAuthorized(request) {
  const expected = process.env.ADMIN_API_KEY?.trim();
  const given = request.headers.get("x-admin-key") || "";
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Accepts a bare 11-char id or any common YouTube URL form
function parseYoutubeId(value) {
  const v = String(value).trim();
  if (/^[\w-]{11}$/.test(v)) return v;
  const m = v.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/);
  return m ? m[1] : null;
}

// Admin-only: POST /api/ai-videos/add with header `x-admin-key: <ADMIN_API_KEY>`
// body: { title, topic, youtube_id OR video_url, thumbnail_url, duration_sec, language,
//         description?, order_index? }
export async function POST(request) {
  try {
    if (!process.env.ADMIN_API_KEY?.trim()) {
      return NextResponse.json(
        { error: "ADMIN_API_KEY is not set on the server, so this route is disabled" },
        { status: 503 }
      );
    }
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const title = body.title?.trim();
    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const hasYoutube = Boolean(body.youtube_id?.toString().trim());
    const hasUrl = Boolean(body.video_url?.toString().trim());
    if (hasYoutube === hasUrl) {
      return NextResponse.json(
        { error: "Provide exactly one of youtube_id or video_url" },
        { status: 400 }
      );
    }

    let youtubeId = null;
    let videoUrl = null;
    if (hasYoutube) {
      youtubeId = parseYoutubeId(body.youtube_id);
      if (!youtubeId) {
        return NextResponse.json({ error: "youtube_id is not a valid YouTube id or URL" }, { status: 400 });
      }
    } else {
      videoUrl = body.video_url.toString().trim();
      if (!/^https?:\/\//i.test(videoUrl)) {
        return NextResponse.json({ error: "video_url must start with http:// or https://" }, { status: 400 });
      }
    }

    const language = body.language || "he";
    if (!LANGS.includes(language)) {
      return NextResponse.json({ error: `language must be one of ${LANGS.join(", ")}` }, { status: 400 });
    }

    let durationSec = null;
    if (body.duration_sec !== undefined && body.duration_sec !== null && body.duration_sec !== "") {
      durationSec = Number(body.duration_sec);
      if (!Number.isInteger(durationSec) || durationSec < 0) {
        return NextResponse.json({ error: "duration_sec must be a non-negative integer" }, { status: 400 });
      }
    }

    const admin = requireAdmin();

    // Default: append to the end of the feed
    let orderIndex = body.order_index;
    if (!Number.isInteger(orderIndex)) {
      const { data: last } = await admin
        .from("ai_videos")
        .select("order_index")
        .order("order_index", { ascending: false })
        .limit(1)
        .maybeSingle();
      orderIndex = (last?.order_index ?? -1) + 1;
    }

    const { data, error } = await admin
      .from("ai_videos")
      .insert({
        title,
        description: body.description?.trim() || null,
        topic: body.topic?.trim() || null,
        youtube_id: youtubeId,
        video_url: videoUrl,
        thumbnail_url:
          body.thumbnail_url?.trim() ||
          (youtubeId ? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg` : null),
        duration_sec: durationSec,
        language,
        order_index: orderIndex,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    return NextResponse.json({ video: data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
