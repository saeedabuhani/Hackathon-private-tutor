import { NextResponse } from "next/server";
import { requireUser, getOwnedSession, throwDb, HttpError } from "@/lib/server";

export const runtime = "nodejs";

const ROLES = ["user", "assistant"];
const STUCK_TYPES = ["term", "missing_base", "general_confusion"];
const MAX_CONTENT_CHARS = 20000;

// GET /api/sessions/[sessionId]/messages
//   -> { messages: [{ role, content, stuck_type, language_bridge, created_at }] } in order
export async function GET(request, { params }) {
  try {
    const { admin, userId } = await requireUser(request);
    await getOwnedSession(admin, params.sessionId, userId);

    const { data, error } = await admin
      .from("chat_messages")
      .select("role, content, stuck_type, language_bridge, created_at")
      .eq("session_id", params.sessionId)
      .order("created_at", { ascending: true });
    throwDb(error);
    return NextResponse.json({ messages: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

// POST /api/sessions/[sessionId]/messages { role, content, stuck_type?, language_bridge? }
//   -> { id }   (also bumps the session's updated_at so it moves to the top of the sidebar)
export async function POST(request, { params }) {
  try {
    const { admin, userId } = await requireUser(request);
    await getOwnedSession(admin, params.sessionId, userId);

    const { role, content, stuck_type, language_bridge } = await request.json();
    if (!ROLES.includes(role)) throw new HttpError(400, "role must be 'user' or 'assistant'");
    if (typeof content !== "string" || !content.trim()) throw new HttpError(400, "content is required");
    if (content.length > MAX_CONTENT_CHARS) throw new HttpError(413, "content is too long");

    const { data, error } = await admin
      .from("chat_messages")
      .insert({
        session_id: params.sessionId,
        role,
        content,
        stuck_type: STUCK_TYPES.includes(stuck_type) ? stuck_type : null,
        language_bridge:
          language_bridge && typeof language_bridge === "object" ? language_bridge : null,
      })
      .select("id")
      .single();
    throwDb(error);

    const { error: touchError } = await admin
      .from("chat_sessions")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", params.sessionId);
    throwDb(touchError);

    return NextResponse.json({ id: data.id }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}
