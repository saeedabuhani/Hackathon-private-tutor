import { NextResponse } from "next/server";
import { requireUser, ownsMaterial, throwDb, HttpError } from "@/lib/server";

export const runtime = "nodejs";

// GET /api/sessions -> { sessions: [{ id, title, preview, material_id, materialTitle, updated_at }] }
// The caller's conversations, most recently active first.
export async function GET(request) {
  try {
    const { admin, userId } = await requireUser(request);
    const { data, error } = await admin
      .from("chat_sessions")
      .select("id, title, preview, material_id, updated_at, materials(title)")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    throwDb(error);

    const sessions = data.map((s) => ({
      id: s.id,
      title: s.title,
      preview: s.preview,
      material_id: s.material_id,
      materialTitle: s.materials?.title || null,
      updated_at: s.updated_at,
    }));
    return NextResponse.json({ sessions });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

// POST /api/sessions { materialId, firstMessage } -> { sessionId }
export async function POST(request) {
  try {
    const { admin, userId } = await requireUser(request);
    const { materialId, firstMessage } = await request.json();
    if (!materialId || typeof firstMessage !== "string" || !firstMessage.trim()) {
      throw new HttpError(400, "materialId and firstMessage are required");
    }
    if (!(await ownsMaterial(admin, materialId, userId))) {
      throw new HttpError(404, "Material not found");
    }

    const text = firstMessage.trim();
    const { data, error } = await admin
      .from("chat_sessions")
      .insert({
        user_id: userId,
        material_id: materialId,
        title: text.slice(0, 50),
        preview: text.slice(0, 80),
      })
      .select("id")
      .single();
    throwDb(error);

    return NextResponse.json({ sessionId: data.id }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}
