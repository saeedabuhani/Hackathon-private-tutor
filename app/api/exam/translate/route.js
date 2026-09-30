import { NextResponse } from "next/server";
import { complete, LANG_NAMES } from "@/lib/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_QUESTION_CHARS = 2000;
const MAX_HINT_CHARS = 1500;

// POST { question, hint, targetLanguage: 'he'|'ar'|'en' } -> { question, hint }
// Translates an exam question and its Active Recall hint. Nothing is stored, no material is read.
export async function POST(request) {
  try {
    const { question, hint, targetLanguage } = await request.json();

    if (typeof question !== "string" || !question.trim()) {
      return NextResponse.json({ error: "question is required" }, { status: 400 });
    }
    if (!LANG_NAMES[targetLanguage]) {
      return NextResponse.json({ error: "targetLanguage must be he, ar or en" }, { status: 400 });
    }
    const hintText = typeof hint === "string" ? hint.trim() : "";
    if (question.length > MAX_QUESTION_CHARS || hintText.length > MAX_HINT_CHARS) {
      return NextResponse.json({ error: "Text is too long to translate" }, { status: 413 });
    }

    const language = LANG_NAMES[targetLanguage];
    const system = `Translate the following to ${language}.
Keep technical terms in English (like JavaScript, React, API).
Return JSON: { "question": "...", "hint": "..." }
The input is a JSON object with the same two fields. If "hint" is empty, return "" for it.`;

    const content = await complete(
      [
        { role: "system", content: system },
        { role: "user", content: JSON.stringify({ question: question.trim(), hint: hintText }) },
      ],
      { temperature: 0.1, maxTokens: 500, json: true }
    );

    let result;
    try {
      result = JSON.parse(content);
    } catch {
      return NextResponse.json({ error: "The translation came back incomplete, try again" }, { status: 502 });
    }
    if (typeof result.question !== "string" || !result.question.trim()) {
      return NextResponse.json({ error: "AI returned an invalid translation" }, { status: 502 });
    }

    return NextResponse.json({
      question: result.question.trim(),
      hint: hintText && typeof result.hint === "string" ? result.hint.trim() : "",
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
