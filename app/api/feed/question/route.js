import { NextResponse } from "next/server";
import { askJson, LANG_NAMES } from "@/lib/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const LETTERS = ["a", "b", "c", "d"];

// POST { videoTitle, videoDescription, lang } -> { question, options[4], correct: 'a'..'d' }
export async function POST(request) {
  try {
    const { videoTitle, videoDescription, lang } = await request.json();
    if (!videoTitle) {
      return NextResponse.json({ error: "videoTitle is required" }, { status: 400 });
    }
    const language = LANG_NAMES[lang] || "English";

    const system = `Based on this video title and description, generate ONE short multiple-choice question in ${language}.
Return JSON: { "question": "...", "options": ["...", "...", "...", "..."], "correct": "a" }
- "options" must be exactly 4 answer texts (do not prefix them with letters).
- "correct" is the letter (a, b, c or d) of the correct option, matching its position in "options".
- Only ask about what the title and description support; do not invent details.`;

    const result = await askJson(
      system,
      `Title: ${videoTitle}\nDescription: ${videoDescription || "(none)"}`
    );

    const correct = String(result.correct || "").toLowerCase();
    if (
      !result.question ||
      !Array.isArray(result.options) ||
      result.options.length !== 4 ||
      !LETTERS.includes(correct)
    ) {
      return NextResponse.json({ error: "AI returned an invalid question" }, { status: 502 });
    }

    return NextResponse.json({
      question: result.question,
      options: result.options.map(String),
      correct,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
