import { NextResponse } from "next/server";
import {
  requireAdmin,
  ownsMaterial,
  getContext,
  askJson,
  updateGapMap,
  LANG_NAMES,
} from "@/lib/server";
import { detectLanguage } from "@/lib/utils";

export const runtime = "nodejs";
export const maxDuration = 60;

// Evaluate the student's answer. Never reveals the answer: on a wrong answer
// it returns an Active Recall hint that points back to the material.
export async function POST(request) {
  try {
    const { materialId, topic, question, userAnswer, userId } = await request.json();
    if (!materialId || !topic || !question || !userAnswer?.trim() || !userId) {
      return NextResponse.json(
        { error: "materialId, topic, question, userAnswer and userId are required" },
        { status: 400 }
      );
    }

    const admin = requireAdmin();
    if (!(await ownsMaterial(admin, materialId, userId))) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    const chunks = await getContext(admin, materialId, `${topic}\n${question}`, 5);
    // Language of the feedback follows what the student just wrote, not a stale
    // global "activeLanguage" flag from an unrelated feature (that flag was the bug).
    const detectedLang = detectLanguage(userAnswer);
    const language = LANG_NAMES[detectedLang] || "the dominant language of the answer";

    const system = `You are a strict professor grading a student's answer using ONLY this material:
${chunks}

Question: "${question}"

Rules:
- Judge the answer against the material only.
- Score from 0 to 100 (100 = fully correct and complete).
- NEVER state the correct answer. If the answer is not fully correct, give an Active Recall hint:
  point to where in the material to look and which angle to reconsider, and end with a guiding question.
- Write "feedback" in ${language}.

Respond in JSON:
{
  "is_correct": true,
  "score": 0,
  "feedback": "short feedback / Active Recall hint in ${language}",
  "source_reference": "Slide 27"
}`;

    const result = await askJson(system, `Student answer: ${userAnswer}`);
    const score = Math.max(0, Math.min(100, Number(result.score) || 0));
    const isCorrect = Boolean(result.is_correct);

    await admin.from("quiz_attempts").insert({
      material_id: materialId,
      user_id: userId,
      topic,
      question,
      user_answer: userAnswer,
      is_correct: isCorrect,
      hint_given: isCorrect ? null : result.feedback,
    });
    const gap = await updateGapMap(admin, { userId, materialId, topic, score });

    return NextResponse.json({
      isCorrect,
      score,
      feedback: result.feedback || "",
      sourceReference: result.source_reference || "",
      gap,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
