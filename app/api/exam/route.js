import { NextResponse } from "next/server";
import { requireAdmin, ownsMaterial, getContext, askJson, LANG_NAMES } from "@/lib/server";
import { detectLanguage } from "@/lib/utils";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request) {
  try {
    const { materialId, topic, userId } = await request.json();
    if (!materialId || !topic?.trim() || !userId) {
      return NextResponse.json(
        { error: "materialId, topic and userId are required" },
        { status: 400 }
      );
    }

    const admin = requireAdmin();
    if (!(await ownsMaterial(admin, materialId, userId))) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    const chunks = await getContext(admin, materialId, topic, 5);
    // Language follows the material's own content, not the topic label (topics are
    // extracted in English by GPT-4o even for Hebrew/Arabic materials — see
    // lib/embeddings.js extractTopics) and not a stale global "activeLanguage" flag.
    const detectedLang = detectLanguage(chunks || topic);
    const language = LANG_NAMES[detectedLang] || "the material's own language";

    const system = `Generate ONE exam question about "${topic}" based ONLY on this material:
${chunks}

Rules:
- The question must be TRICKY and detail-oriented, not generic.
- Focus on edge cases, exceptions, "why not", or comparison scenarios.
- Do NOT give the answer in the question.
- Generate a hint that points to the specific location without giving the answer.
- Write the question and hint in ${language}.

Respond in JSON:
{
  "question": "the exam question...",
  "hint": "Review [Slide/Page X], focus on [specific angle]. Is [concept] really what you think?",
  "source_reference": "Slide 27"
}`;

    const result = await askJson(system, `Topic: ${topic}`);
    if (!result.question) {
      return NextResponse.json({ error: "AI returned an invalid response" }, { status: 502 });
    }

    return NextResponse.json({
      question: result.question,
      hint: result.hint || "",
      sourceReference: result.source_reference || "",
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
