import { HttpError, requireUser } from "@/lib/server";
import { fail, dbCheck } from "@/lib/careerServer";
import { buildJobLinks } from "@/lib/careerData";
import { buildSummaryMarkdown } from "@/lib/careerAI";
import { toPdf } from "@/lib/summaryExport";

export const runtime = "nodejs";
export const maxDuration = 60;

const LIMIT = 30; // the newest 30 of each, so the PDF stays a sensible size

// GET /api/career/summary?lang=he|en|ar  ->  the PDF itself (application/pdf)
// Profile, the interview questions practiced with score and the model answer, the code challenges,
// and the job-search links. Only the caller's own rows (their token decides who that is).
export async function GET(request) {
  try {
    const { admin, userId } = await requireUser(request);
    const langParam = new URL(request.url).searchParams.get("lang");
    const lang = ["he", "ar", "en"].includes(langParam) ? langParam : "en";

    const [profileRes, sessionsRes, challengesRes] = await Promise.all([
      admin.from("career_profiles").select("role, level, skills, languages").eq("user_id", userId).maybeSingle(),
      admin.from("interview_sessions").select("question, question_type, score, ai_feedback, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(LIMIT),
      admin.from("code_challenges").select("title, difficulty, language, is_correct, xp_earned, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(LIMIT),
    ]);
    dbCheck(profileRes.error);
    dbCheck(sessionsRes.error);
    dbCheck(challengesRes.error);
    const profile = profileRes.data;
    if (!profile) throw new HttpError(404, "Create your career profile first");

    // the name from sign-up, else the start of the email
    let name = "";
    try {
      const { data } = await admin.auth.admin.getUserById(userId);
      name = data?.user?.user_metadata?.name || (data?.user?.email || "").split("@")[0] || "";
    } catch {
      // the name is only decoration
    }

    const { title, markdown } = buildSummaryMarkdown({
      name,
      profile,
      sessions: (sessionsRes.data || []).reverse(), // oldest first, so it reads as a progression
      challenges: (challengesRes.data || []).reverse(),
      links: buildJobLinks(profile.role, profile.level),
      lang,
    });
    const pdf = await toPdf(title, markdown, lang, { autoDir: true });
    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="Career-Prep-Summary.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return fail(err);
  }
}
