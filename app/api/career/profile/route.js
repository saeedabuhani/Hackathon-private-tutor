import { NextResponse } from "next/server";
import { HttpError, requireUser } from "@/lib/server";
import { fail, dbCheck, readBody } from "@/lib/careerServer";
import { roleById, LEVELS } from "@/lib/careerData";
import { strList } from "@/lib/careerAI";

export const runtime = "nodejs";

const COLUMNS = "role, level, skills, languages, updated_at";

// GET -> { profile } (null until the user has saved one)
export async function GET(request) {
  try {
    const { admin, userId } = await requireUser(request);
    const { data, error } = await admin.from("career_profiles").select(COLUMNS).eq("user_id", userId).maybeSingle();
    dbCheck(error);
    return NextResponse.json({ profile: data || null });
  } catch (err) {
    return fail(err);
  }
}

// POST { role, level, skills, languages } -> { profile }  (creates or updates the caller's profile)
export async function POST(request) {
  try {
    const { admin, userId } = await requireUser(request);
    const body = await readBody(request);
    if (!roleById(body.role)) throw new HttpError(400, "role is not valid");
    if (!LEVELS.includes(body.level)) throw new HttpError(400, "level is not valid");
    const skills = strList(body.skills, 15, 40);
    const languages = strList(body.languages, 12, 30);
    if (skills.length === 0) throw new HttpError(400, "Pick at least one skill");

    const { data, error } = await admin
      .from("career_profiles")
      .upsert(
        { user_id: userId, role: body.role, level: body.level, skills, languages, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      )
      .select(COLUMNS)
      .single();
    dbCheck(error);
    return NextResponse.json({ profile: data });
  } catch (err) {
    return fail(err);
  }
}
