import { getOpenAI, OPENAI_MODEL } from "@/lib/openai";

export const VISION_FALLBACK_MESSAGE =
  "We couldn't read the handwriting, please upload a PDF";

const IMAGE_MIME = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

export function detectFileType(filename = "") {
  const ext = filename.split(".").pop().toLowerCase();
  if (ext === "pdf") return "pdf";
  if (ext === "docx") return "docx";
  if (IMAGE_MIME[ext]) return "image";
  return null;
}

export async function extractPdf(buffer) {
  // Import the inner file: pdf-parse's index.js runs a debug routine that breaks in Next.js
  const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
  const data = await pdfParse(buffer);
  return data.text;
}

export async function extractDocx(buffer) {
  const mammoth = (await import("mammoth")).default;
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

export async function extractImage(buffer, filename) {
  const ext = filename.split(".").pop().toLowerCase();
  const mime = IMAGE_MIME[ext] || "image/png";
  const dataUrl = `data:${mime};base64,${buffer.toString("base64")}`;

  const openai = getOpenAI();
  const res = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: 0.3,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Extract all text from this image exactly as written, preserving structure",
          },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ],
  });
  return res.choices[0]?.message?.content || "";
}

// Returns { fileType, text }
export async function extractText(buffer, filename) {
  const fileType = detectFileType(filename);
  if (!fileType) throw new Error("Unsupported file type. Use PDF, DOCX or an image.");

  let text = "";
  if (fileType === "pdf") text = await extractPdf(buffer);
  else if (fileType === "docx") text = await extractDocx(buffer);
  else text = await extractImage(buffer, filename);

  return { fileType, text: text.trim() };
}
