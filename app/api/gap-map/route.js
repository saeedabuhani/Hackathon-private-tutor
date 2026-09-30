import { NextResponse } from "next/server";
import { requireAdmin, ownsMaterial, updateGapMap } from "@/lib/server";

export const runtime = "nodejs";

// GET /api/gap-map?userId=...&materialId=...   (materialId optional)
export async function GET(request) {
  try {
    const params = new URL(request.url).searchParams;
    const userId = params.get("userId");
    const materialId = params.get("materialId");
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const admin = requireAdmin();
    let query = admin.from("gap_map").select("*").eq("user_id", userId);
    if (materialId) query = query.eq("material_id", materialId);
    const { data, error } = await query.order("score_avg", { ascending: true });
    if (error) throw new Error(error.message);
    return NextResponse.json({ gaps: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST { userId, materialId, topic, score }  score = 0..100
export async function POST(request) {
  try {
    const { userId, materialId, topic, score } = await request.json();
    if (!userId || !materialId || !topic || typeof score !== "number") {
      return NextResponse.json(
        { error: "userId, materialId, topic and numeric score are required" },
        { status: 400 }
      );
    }

    const admin = requireAdmin();
    if (!(await ownsMaterial(admin, materialId, userId))) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }
    const gap = await updateGapMap(admin, {
      userId,
      materialId,
      topic,
      score: Math.max(0, Math.min(100, score)),
    });
    return NextResponse.json({ gap });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
