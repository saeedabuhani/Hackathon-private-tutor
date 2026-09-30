import { NextResponse } from "next/server";
import { requireAdmin, ownsMaterial, complete, LANG_NAMES } from "@/lib/server";
import { detectLanguage } from "@/lib/utils";
import { buildExport, EXPORT_FORMATS } from "@/lib/summaryExport";
import { buildSummaryPrompt, isInLanguage, scriptShare, retryReminder } from "@/lib/summaryPrompt";

export const runtime = "nodejs";
export const maxDuration = 60;

// gpt-4o's context is 128k tokens, but we keep this well under that for cost/speed.
// Full "smart chunking" for very large files is a later improvement, not done here.
const MAX_SUMMARY_CHARS = 24000;

// Write the summary in `language`. The instruction is in the system prompt AND repeated in the
// user message (models mirror the language of the material otherwise). If the answer still
// comes back in the wrong language, ask once more before giving up.
async function summarizeIn(language, material) {
  const name = LANG_NAMES[language];
  const system = buildSummaryPrompt(language);
  const userMessage = `Write the summary entirely in ${name}.\n\n--- STUDY MATERIAL ---\n${material}`;

  let summary = await complete(
    [
      { role: "system", content: system },
      { role: "user", content: userMessage },
    ],
    { maxTokens: 2000 }
  );

  if (!isInLanguage(summary, language)) {
    console.warn(
      `[summary] answer was not in ${language} (share ${scriptShare(summary, language).toFixed(2)}) - retrying`
    );
    summary = await complete(
      [
        { role: "system", content: system },
        { role: "user", content: userMessage },
        { role: "assistant", content: summary },
        { role: "user", content: retryReminder(language) },
      ],
      { maxTokens: 2000 }
    );
  }
  return summary;
}

// POST { materialId, userId, language?: 'he'|'en'|'ar', format?: 'pdf'|'word', markdown? }
//   -> { title, summary, language, file }
// `language` in the answer is the one actually used (the material's own language when none
// was asked for), so the client and the PDF / Word export agree on left-to-right vs right-to-left.
// `file` is { name, mime, base64 } when a format was asked for (or { error } if the export
// failed, so the summary text is never lost). Passing `markdown` skips the AI call and only
// exports it, so the same summary can be downloaded in another format without a second one.
export async function POST(request) {
  try {
    const { materialId, userId, language, format, markdown } = await request.json();
    console.log(`[summary] language received from client: ${JSON.stringify(language)}, format: ${JSON.stringify(format)}`);

    if (!materialId || !userId) {
      return NextResponse.json({ error: "materialId and userId are required" }, { status: 400 });
    }
    if (language && !LANG_NAMES[language]) {
      return NextResponse.json({ error: "language must be he, en or ar" }, { status: 400 });
    }
    if (format && !EXPORT_FORMATS[format]) {
      return NextResponse.json({ error: "format must be pdf or word" }, { status: 400 });
    }

    const admin = requireAdmin();
    if (!(await ownsMaterial(admin, materialId, userId))) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    const { data: material, error } = await admin
      .from("materials")
      .select("title, content")
      .eq("id", materialId)
      .single();
    if (error) throw new Error(error.message);

    // No language chosen: follow the material ("mixed" Hebrew + Arabic falls back to Hebrew)
    const detected = detectLanguage(material.content || "");
    const resolved = language || (LANG_NAMES[detected] ? detected : "he");
    console.log(`[summary] language used: ${resolved}${language ? "" : ` (detected from the material: ${detected})`}`);

    let summary = typeof markdown === "string" && markdown.trim() ? markdown : null;
    if (!summary) {
      if (!material.content) {
        return NextResponse.json({ error: "This material has no extracted text" }, { status: 422 });
      }
      summary = await summarizeIn(resolved, material.content.slice(0, MAX_SUMMARY_CHARS));
    }

    let file = null;
    if (format) {
      try {
        file = await buildExport(format, material.title, summary, resolved);
      } catch (err) {
        file = { error: `Could not create the ${format.toUpperCase()} file: ${err.message}` };
      }
    }

    return NextResponse.json({ title: material.title, summary, language: resolved, file });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
