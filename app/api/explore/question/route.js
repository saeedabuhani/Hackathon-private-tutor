import { NextResponse } from "next/server";
import { askJson, LANG_NAMES } from "@/lib/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const LETTERS = ["A", "B", "C"];

// POST { videoTitle, topic, lang } -> { question, optionA, optionB, optionC, correct: 'A'|'B'|'C' }
export async function POST(request) {
  try {
    const { videoTitle, topic, lang } = await request.json();
    if (!videoTitle || !topic) {
      return NextResponse.json({ error: "videoTitle and topic are required" }, { status: 400 });
    }
    const language = LANG_NAMES[lang] || "English";

    const system = `Based on this video title: "${videoTitle}" about ${topic}, create ONE multiple choice question in ${language}.
Return JSON: { "question": "...", "optionA": "...", "optionB": "...", "optionC": "...", "correct": "A" | "B" | "C" }
Keep it simple, one clear correct answer, based only on what the title implies about ${topic}.`;

    const result = await askJson(system, `Video: ${videoTitle}`);
    const correct = String(result.correct || "").toUpperCase();
    if (!result.question || !result.optionA || !result.optionB || !result.optionC || !LETTERS.includes(correct)) {
      return NextResponse.json({ error: "AI returned an invalid question" }, { status: 502 });
    }

    return NextResponse.json({
      question: result.question,
      optionA: result.optionA,
      optionB: result.optionB,
      optionC: result.optionC,
      correct,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
