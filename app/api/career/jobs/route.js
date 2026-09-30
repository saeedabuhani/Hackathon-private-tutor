import { NextResponse } from "next/server";
import { HttpError, requireUser } from "@/lib/server";
import { fail, askClean } from "@/lib/careerServer";
import { readContext, jobKitPrompt, cleanJobKit, strList } from "@/lib/careerAI";

export const runtime = "nodejs";
export const maxDuration = 60;

// GET /api/career/jobs?role=&level=&lang=&skills=a,b&languages=a,b
//   -> { kit: { headline, about, skills, tips } }
// The AI writes a LinkedIn profile kit for the role. The job-board search links are plain URLs built
// in the browser from lib/careerData.js (buildJobLinks), so they don't need a request.
export async function GET(request) {
  try {
    await requireUser(request); // the AI call costs money: only for signed-in users
    const p = new URL(request.url).searchParams;
    const ctx = readContext({ role: p.get("role"), level: p.get("level"), lang: p.get("lang") });
    if (ctx.error) throw new HttpError(400, ctx.error);
    const skills = strList((p.get("skills") || "").split(","), 12, 40);
    const languages = strList((p.get("languages") || "").split(","), 8, 30);

    const kit = await askClean(jobKitPrompt({ ...ctx, skills, languages }), cleanJobKit, { maxTokens: 1400 });
    return NextResponse.json({ kit });
  } catch (err) {
    return fail(err);
  }
}
