import { NextResponse } from "next/server";
import { HttpError, requireUser, addXP } from "@/lib/server";
import { fail, dbCheck, readBody, askClean } from "@/lib/careerServer";
import {
  readContext,
  isDifficulty,
  isCodeLanguage,
  challengePrompt,
  cleanChallenge,
  reviewPrompt,
  cleanReview,
  str,
} from "@/lib/careerAI";
import { signChallenge, verifyChallenge } from "@/lib/careerSign";

export const runtime = "nodejs";
export const maxDuration = 60;

// POST /api/career/challenge
//   step 1: { role, level, difficulty, language, lang }
//           -> { title, description, examples, hints, starterCode, difficulty, language, token }
//   step 2: { role, level, lang, challenge: { title, description, examples, difficulty, language, token }, userCode }
//           -> { isCorrect, score, verdict, issues, goodParts, optimalSolution, explanation,
//                xpEarned, alreadySolved, newTotal? }   (saved; XP added when it is correct)
export async function POST(request) {
  try {
    const { admin, userId } = await requireUser(request);
    const body = await readBody(request);
    const ctx = readContext(body);
    if (ctx.error) throw new HttpError(400, ctx.error);

    // ---- step 1: write a challenge, and sign it
    if (!body.challenge) {
      if (!isDifficulty(body.difficulty)) throw new HttpError(400, "difficulty is not valid");
      if (!isCodeLanguage(body.language)) throw new HttpError(400, "language is not valid");
      const c = await askClean(
        challengePrompt({ ...ctx, difficulty: body.difficulty, language: body.language }),
        cleanChallenge,
        { maxTokens: 1400 }
      );
      const challenge = { ...c, difficulty: body.difficulty, language: body.language };
      return NextResponse.json({ ...challenge, token: signChallenge(userId, challenge) });
    }

    // ---- step 2: review the code
    const given = body.challenge;
    const challenge = {
      title: str(given.title, 120),
      description: str(given.description, 4000),
      difficulty: given.difficulty,
      language: given.language,
      examples: (Array.isArray(given.examples) ? given.examples : []).slice(0, 4).map((e) => ({
        input: str(String(e?.input ?? ""), 300),
        output: str(String(e?.output ?? ""), 300),
      })),
    };
    // The difficulty decides the XP, so the challenge must be the one this server wrote
    if (!isDifficulty(challenge.difficulty) || !isCodeLanguage(challenge.language) || !verifyChallenge(userId, challenge, given.token)) {
      throw new HttpError(400, "This challenge is not valid. Start a new one.");
    }
    const userCode = typeof body.userCode === "string" ? body.userCode.slice(0, 8000) : "";
    if (userCode.trim().length < 5) throw new HttpError(400, "Write some code first");

    const review = await askClean(
      reviewPrompt({ ...ctx, challenge, language: challenge.language, userCode }),
      (raw) => cleanReview(raw, challenge.difficulty),
      { maxTokens: 1800, temperature: 0.2 }
    );

    // XP only once per challenge: solving the same one again shows the result but adds nothing
    const problem = `${challenge.title}\n${challenge.description}`;
    let xpEarned = review.xpEarned;
    let alreadySolved = false;
    if (review.isCorrect) {
      const { data: earlier, error: e1 } = await admin
        .from("code_challenges")
        .select("id")
        .eq("user_id", userId)
        .eq("problem", problem)
        .eq("is_correct", true)
        .gt("xp_earned", 0)
        .limit(1);
      dbCheck(e1);
      if (earlier?.length) {
        alreadySolved = true;
        xpEarned = 0;
      }
    }
    let newTotal;
    if (xpEarned > 0) {
      try {
        newTotal = await addXP(admin, userId, xpEarned);
      } catch {
        xpEarned = 0; // XP is a bonus: never lose the review because of it
      }
    }

    const { error } = await admin.from("code_challenges").insert({
      user_id: userId,
      title: challenge.title,
      difficulty: challenge.difficulty,
      language: challenge.language,
      problem,
      user_code: userCode,
      ai_feedback: JSON.stringify({ ...review, xpEarned }),
      is_correct: review.isCorrect,
      xp_earned: xpEarned,
    });
    dbCheck(error);
    return NextResponse.json({ ...review, xpEarned, alreadySolved, ...(newTotal !== undefined ? { newTotal } : {}) });
  } catch (err) {
    return fail(err);
  }
}
