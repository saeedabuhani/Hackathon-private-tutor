import { NextResponse } from "next/server";
import { HttpError, requireUser } from "@/lib/server";
import { fail, dbCheck, readBody, askClean } from "@/lib/careerServer";
import {
  readContext,
  isQuestionType,
  questionPrompt,
  cleanQuestion,
  answerPrompt,
  cleanFeedback,
  str,
} from "@/lib/careerAI";

export const runtime = "nodejs";
export const maxDuration = 60;

// POST /api/career/interview
//   step 1: { role, level, questionType, lang }
//           -> { question, hint, expectedKeywords }
//   step 2: { role, level, questionType, lang, question, userAnswer }
//           -> { score, strengths, improvements, improvedAnswer, tip, sessionId }   (and it is saved)
export async function POST(request) {
  try {
    const { admin, userId } = await requireUser(request);
    const body = await readBody(request);
    const ctx = readContext(body);
    if (ctx.error) throw new HttpError(400, ctx.error);
    if (!isQuestionType(body.questionType)) throw new HttpError(400, "questionType is not valid");
    const type = body.questionType;

    // ---- step 1: ask a question
    if (typeof body.userAnswer !== "string") {
      const question = await askClean(questionPrompt({ ...ctx, type }), (raw) => cleanQuestion(raw, type), { maxTokens: 900 });
      return NextResponse.json(question);
    }

    // ---- step 2: evaluate the answer, and keep it
    const question = str(body.question, 3000);
    const userAnswer = str(body.userAnswer, 4000);
    if (!question) throw new HttpError(400, "question is required");
    if (userAnswer.length < 10) throw new HttpError(400, "Write a real answer first (at least a sentence)");

    const feedback = await askClean(answerPrompt({ ...ctx, type, question, userAnswer }), cleanFeedback, { maxTokens: 1500 });
    const { data, error } = await admin
      .from("interview_sessions")
      .insert({
        user_id: userId,
        role: ctx.role.id,
        question,
        question_type: type,
        user_answer: userAnswer,
        ai_feedback: JSON.stringify(feedback),
        score: feedback.score,
      })
      .select("id")
      .single();
    dbCheck(error);
    return NextResponse.json({ ...feedback, sessionId: data.id });
  } catch (err) {
    return fail(err);
  }
}
