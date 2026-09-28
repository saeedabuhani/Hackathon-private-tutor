import { NextResponse } from "next/server";
import { requireUser, getOwnedSession, throwDb } from "@/lib/server";

export const runtime = "nodejs";

// DELETE /api/sessions/[sessionId] -> { success: true }
// chat_messages rows go with it (ON DELETE CASCADE).
export async function DELETE(request, { params }) {
  try {
    const { admin, userId } = await requireUser(request);
    await getOwnedSession(admin, params.sessionId, userId);

    const { error } = await admin.from("chat_sessions").delete().eq("id", params.sessionId);
    throwDb(error);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}
