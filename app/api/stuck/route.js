import { NextResponse } from "next/server";
import { requireAdmin, ownsMaterial, getContext, complete, LANG_NAMES } from "@/lib/server";
import { detectLanguage } from "@/lib/utils";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_HISTORY_MESSAGES = 10;
const CHAT_TEMPERATURE = 0.4; // a bit more room than the app default (0.3) for richer examples
const CHAT_MAX_TOKENS = 2500;
const RAG_CHUNKS = 8;
const THINKING_TEMPERATURE = 0.3; // focused, not creative — this is just planning
const THINKING_MAX_TOKENS = 400;

// Exact section headers per language — the model is told to use these literally
// instead of "translate the header yourself", which is what made it drift before.
const HEADERS = {
  he: {
    explain: "📌 הסבר מעמיק",
    analogy: "💡 אנלוגיה מהחיים",
    code: "💻 קוד עם הסבר שורה-שורה",
    example: "✅ שאלה ותשובה אמיתית",
    keyPoints: "🔍 נקודות חשובות",
    checkYourself: "❓ בדוק את עצמך",
    grounded: "לפי החומר שלך",
    notInMaterial: "הנושא הזה לא מוסבר בחומר שלך, אבל הנה הסבר כללי:",
  },
  ar: {
    explain: "📌 شرح معمّق",
    analogy: "💡 تشبيه من الحياة الواقعية",
    code: "💻 كود مع شرح سطرًا بسطر",
    example: "✅ سؤال وجواب حقيقي",
    keyPoints: "🔍 نقاط مهمة",
    checkYourself: "❓ اختبر نفسك",
    grounded: "بحسب المادة الخاصة بك",
    notInMaterial: "هذا الموضوع غير مشروح في المادة الخاصة بك، لكن إليك شرحًا عامًا:",
  },
  en: {
    explain: "📌 In-depth explanation",
    analogy: "💡 Real-life analogy",
    code: "💻 Code with a line-by-line explanation",
    example: "✅ A real question and answer",
    keyPoints: "🔍 Key points",
    checkYourself: "❓ Check yourself",
    grounded: "According to your material",
    notInMaterial: "This topic isn't explained in your uploaded material, but here's a general explanation:",
  },
};

// Stage A (Chain of Thought): a short, cheap planning pass the student never sees.
// It runs before the real answer so the model reasons about the question first,
// instead of writing the deep structured answer in one uninterrupted pass.
function buildThinkingPrompt(question, chunks) {
  return `Given this question from a student: "${question}"

And this material (may be empty or irrelevant — that's a valid finding):
${chunks || "(no matching chunks found for this question)"}

Think step by step, briefly. Answer in plain text, a few short bullet points — NOT Markdown,
NOT the final answer, just your own planning notes:
1. What exactly is the student asking?
2. What relevant info (if any) exists in the material above? Be honest if there isn't any.
3. What's the best way to explain this (structure, angle)?
4. What real, concrete example would help most?

Keep this under 120 words total. This note is never shown to the student.`;
}

function buildSystemPrompt(langCode, langName, chunks, thinking) {
  const h = HEADERS[langCode] || HEADERS.en;

  return `You are an expert tutor who gives DEEP, DETAILED explanations, using the Feynman technique.

Context from the student's uploaded lecture material:
${chunks || "(no matching chunks found for this question)"}
${
  thinking
    ? `\nYour own step-by-step planning for this question (from a prior internal reasoning pass —
use it to write a sharper answer, but never repeat it verbatim or mention that you did this
planning step):\n${thinking}\n`
    : ""
}
STRICT RULES:
1. Answer in ${langName} — the same language as the question. If mixed, use the dominant language.
2. You are in an ongoing conversation — the previous turns are included as chat history below the
   system prompt. Read them. Never repeat what you already explained; if this is a follow-up
   question ("give me another example", "why not X"), build on your previous answers instead of
   starting over.
3. Silently fix spelling mistakes or typos in the question and understand the intent — don't call
   out the mistake, just answer what they meant.
4. Be honest about your source. Before writing, decide: does the context above actually EXPLAIN
   this specific topic (not just name it in a heading, a table of contents, or an unrelated
   exercise)?
   - If yes: ground the "${h.explain}" section in it, and open that section with the exact phrase
     "${h.grounded}" before the explanation. You may still add outside knowledge to enrich the
     answer (a sharper analogy, an extra example), but don't present outside knowledge as if it
     came from the material.
   - If no (the context is empty, irrelevant, or only mentions the topic in passing): open the
     "${h.explain}" section with the exact phrase "${h.notInMaterial}" and then STILL give the full
     structure below using your general knowledge. Never stop after just that one line.
   Either way, always fill in stuck_type and suggested_topics normally.
5. "explanation" must be Markdown, AT LEAST 300 words, and use EXACTLY these section headers, in
   this order, as Markdown H2 ("## header") — do not translate or reword them yourself, use them
   verbatim:

## ${h.explain}
At least 3 full paragraphs, in the detail of an experienced teacher — never "in short".

## ${h.analogy}
Compare it to something everyone knows from daily life, and explain the comparison in full —
not just "it's like X".

## ${h.code}
Only if the topic is code-related — omit this whole section otherwise. A real, non-trivial fenced
code block with a comment on each meaningful line, followed by:
**What this code does, line by line:**
- one bullet per line or step
- **Output:** what actually gets printed or returned

## ${h.example}
**Question:** a question that could show up on an exam about this
**Answer:** the full, explained answer
**Why this is the answer:** the reasoning behind it

## ${h.keyPoints}
3-5 specific (not generic) things worth remembering

## ${h.checkYourself}
One question that tests whether the student understood

6. Classify stuck_type:
   - "term": the student doesn't know a single term/concept
   - "missing_base": the student is missing a prerequisite concept
   - "general_confusion": the student is overwhelmed by too much at once
7. If the material uses a DIFFERENT language than the question, fill language_bridge with the
   original term exactly as written in the material.

Respond in this exact JSON format:
{
  "stuck_type": "term | missing_base | general_confusion",
  "explanation": "the full Markdown explanation, following the structure above",
  "language_bridge": {
    "original_term": "exact term as written in the material",
    "slide_ref": "Slide 23 / Page 5 / Section 2",
    "translation": "friendly translation in ${langName}"
  },
  "suggested_topics": ["topic1", "topic2"]
}`;
}

// POST { materialId, question, userId, conversationHistory }
// conversationHistory: prior turns as [{role: 'user'|'assistant', content}], oldest first.
export async function POST(request) {
  try {
    const { materialId, question, userId, conversationHistory = [] } = await request.json();
    if (!materialId || !question?.trim() || !userId) {
      return NextResponse.json(
        { error: "materialId, question and userId are required" },
        { status: 400 }
      );
    }

    const admin = requireAdmin();
    if (!(await ownsMaterial(admin, materialId, userId))) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    // 1. language, 2+3. RAG search (question embedding -> top matching chunks)
    const detectedLang = detectLanguage(question);
    const promptLang = LANG_NAMES[detectedLang] || "the dominant language of the question";
    const context = await getContext(admin, materialId, question, RAG_CHUNKS);

    // Real multi-turn history, not a text blob — the model reads it as actual prior turns
    const history = conversationHistory
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-MAX_HISTORY_MESSAGES)
      .map((m) => ({ role: m.role, content: m.content }));

    // Stage A: think first (short, cheap, never shown to the student). If it fails
    // for any reason, fall back to answering without it rather than failing the request.
    let thinking = "";
    try {
      thinking = await complete(
        [
          { role: "system", content: buildThinkingPrompt(question, context) },
          ...history,
          { role: "user", content: question },
        ],
        { temperature: THINKING_TEMPERATURE, maxTokens: THINKING_MAX_TOKENS }
      );
    } catch (err) {
      console.error("[stuck] thinking step failed, answering without it:", err.message);
    }

    // Stage B: the real, deep answer — informed by stage A's plan
    const messages = [
      { role: "system", content: buildSystemPrompt(detectedLang, promptLang, context, thinking) },
      ...history,
      { role: "user", content: question },
    ];

    let result;
    try {
      result = JSON.parse(
        await complete(messages, { temperature: CHAT_TEMPERATURE, maxTokens: CHAT_MAX_TOKENS, json: true })
      );
    } catch {
      return NextResponse.json({ error: "AI returned an invalid response" }, { status: 502 });
    }

    const stuckType = result.stuck_type || "general_confusion";
    const languageBridge = result.language_bridge || null;
    const suggestedTopics = Array.isArray(result.suggested_topics) ? result.suggested_topics : [];

    // Save stuck point + update gap map (best-effort classification per turn)
    await admin.from("stuck_points").insert({
      material_id: materialId,
      user_id: userId,
      user_question: question,
      detected_language: detectedLang,
      stuck_type: stuckType,
      ai_explanation: result.explanation,
      language_bridge: languageBridge,
    });

    const topic = suggestedTopics[0];
    if (topic) {
      const { data: existing } = await admin
        .from("gap_map")
        .select("stuck_count")
        .eq("user_id", userId)
        .eq("material_id", materialId)
        .eq("topic", topic)
        .maybeSingle();
      await admin.from("gap_map").upsert(
        {
          user_id: userId,
          material_id: materialId,
          topic,
          stuck_count: (existing?.stuck_count || 0) + 1,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,material_id,topic" }
      );
    }

    return NextResponse.json({
      explanation: result.explanation,
      stuckType,
      languageBridge,
      detectedLang,
      suggestedTopics,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
