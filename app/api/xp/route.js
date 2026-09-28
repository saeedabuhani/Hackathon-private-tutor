import { NextResponse } from "next/server";
import { requireAdmin, addXP } from "@/lib/server";

export const runtime = "nodejs";

const MAX_POINTS_PER_CALL = 50;

// POST { userId, points, reason } -> { newTotal }
export async function POST(request) {
  try {
    const { userId, points, reason } = await request.json();
    if (!userId || !Number.isInteger(points) || points <= 0 || points > MAX_POINTS_PER_CALL) {
      return NextResponse.json(
        { error: `userId and an integer points between 1 and ${MAX_POINTS_PER_CALL} are required` },
        { status: 400 }
      );
    }

    const admin = requireAdmin();
    const newTotal = await addXP(admin, userId, points);

    console.log(`[xp] +${points} for ${userId} (${reason || "no reason"}) -> ${newTotal}`);
    return NextResponse.json({ newTotal });
  } catch (err) {
    const status = err.message === "User not found" ? 404 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
