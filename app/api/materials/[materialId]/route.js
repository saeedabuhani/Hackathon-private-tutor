import { NextResponse } from "next/server";
import { requireUser, ownsMaterial, HttpError } from "@/lib/server";

export const runtime = "nodejs";

// DELETE /api/materials/[materialId] -> { success: true }
// Only the owner can delete. Everything hanging off the material — embeddings,
// stuck_points, quiz_attempts, gap_map and chat_sessions (with their messages) — is
// removed by the ON DELETE CASCADE foreign keys in the schema.
export async function DELETE(request, { params }) {
  try {
    const { admin, userId } = await requireUser(request);
    if (!(await ownsMaterial(admin, params.materialId, userId))) {
      throw new HttpError(404, "Material not found");
    }

    const { error } = await admin
      .from("materials")
      .delete()
      .eq("id", params.materialId)
      .eq("user_id", userId);
    if (error) throw new HttpError(500, error.message);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}
