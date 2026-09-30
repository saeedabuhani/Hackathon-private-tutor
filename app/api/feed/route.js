import { NextResponse } from "next/server";
import { searchVideos, FEED_LANGS } from "@/lib/youtube";

export const runtime = "nodejs";

// GET /api/feed?topic=async+await&lang=he|ar|en|all&limit=3
export async function GET(request) {
  try {
    const params = new URL(request.url).searchParams;
    const topic = params.get("topic")?.trim();
    const lang = params.get("lang") || "all";
    const limit = Math.min(Math.max(Number(params.get("limit")) || 3, 1), 5);

    if (!topic) {
      return NextResponse.json({ error: "topic is required" }, { status: 400 });
    }
    if (lang !== "all" && !FEED_LANGS.includes(lang)) {
      return NextResponse.json({ error: "lang must be he, ar, en or all" }, { status: 400 });
    }

    const langs = lang === "all" ? FEED_LANGS : [lang];
    const results = await Promise.allSettled(langs.map((l) => searchVideos(topic, l, limit)));

    const videos = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
    const errors = results
      .map((r, i) => (r.status === "rejected" ? `${langs[i]}: ${r.reason.message}` : null))
      .filter(Boolean);

    if (videos.length === 0 && errors.length === langs.length) {
      return NextResponse.json({ error: errors[0] }, { status: 502 });
    }
    return NextResponse.json({ videos, errors });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
