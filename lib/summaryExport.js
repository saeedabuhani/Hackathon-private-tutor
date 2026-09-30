// Turns the Markdown summary from /api/summary into a downloadable PDF or Word file.
// Server-side only. The Markdown the AI writes is simple (headings, bullets, numbered lists,
// bold, inline code, code blocks), so a small parser is enough and keeps this dependency-free.
import fs from "node:fs";
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  ShadingType,
  TextRun,
} from "docx";

const RTL_LANGS = ["he", "ar"];
export const isRtl = (lang) => RTL_LANGS.includes(lang);

// ---------- Markdown -> blocks ----------

// Blocks: { type: "heading", level, text } | { type: "ul" | "ol", text, indent } |
//         { type: "code", text } | { type: "p", text }
export function parseMarkdown(md) {
  const blocks = [];
  const lines = String(md || "").replace(/\r\n/g, "\n").split("\n");
  let para = [];
  let code = null;

  const flushPara = () => {
    if (para.length) blocks.push({ type: "p", text: para.join(" ") });
    para = [];
  };

  for (const raw of lines) {
    if (/^\s*```/.test(raw)) {
      if (code) {
        blocks.push({ type: "code", text: code.join("\n") });
        code = null;
      } else {
        flushPara();
        code = [];
      }
      continue;
    }
    if (code) {
      code.push(raw);
      continue;
    }

    const line = raw.trimEnd();
    if (!line.trim()) {
      flushPara();
      continue;
    }
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      flushPara();
      blocks.push({ type: "heading", level: Math.min(h[1].length, 3), text: h[2].trim() });
      continue;
    }
    const ul = /^(\s*)[-*•]\s+(.*)$/.exec(line);
    if (ul) {
      flushPara();
      blocks.push({ type: "ul", text: ul[2].trim(), indent: ul[1].length >= 2 ? 1 : 0 });
      continue;
    }
    const ol = /^(\s*)\d+[.)]\s+(.*)$/.exec(line);
    if (ol) {
      flushPara();
      blocks.push({ type: "ol", text: ol[2].trim(), indent: ol[1].length >= 2 ? 1 : 0 });
      continue;
    }
    para.push(line.trim());
  }
  if (code) blocks.push({ type: "code", text: code.join("\n") });
  flushPara();
  return blocks;
}

// "a **b** `c`" -> [{ text, bold, code }]
function inlineRuns(text) {
  const runs = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) runs.push({ text: text.slice(last, m.index) });
    const tok = m[0];
    if (tok.startsWith("**")) runs.push({ text: tok.slice(2, -2), bold: true });
    else runs.push({ text: tok.slice(1, -1), code: true });
    last = m.index + tok.length;
  }
  if (last < text.length) runs.push({ text: text.slice(last) });
  return runs.map((r) => ({ ...r, text: r.text.replace(/\*+/g, "") })).filter((r) => r.text);
}

const escapeHtml = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function inlineHtml(text) {
  return inlineRuns(text)
    .map((r) => {
      const t = escapeHtml(r.text);
      if (r.code) return `<code>${t}</code>`;
      return r.bold ? `<strong>${t}</strong>` : t;
    })
    .join("");
}

// ---------- HTML (for the PDF) ----------

export function toHtml(title, markdown, lang, { autoDir = false } = {}) {
  // autoDir: every heading, paragraph and list item picks its own direction from its first letter, for
  // documents that mix languages (Hebrew text with English questions)
  const da = autoDir ? " dir=\"auto\"" : "";
  const rtl = isRtl(lang);
  const blocks = parseMarkdown(markdown);
  const out = [];
  let open = null; // "ul" | "ol"
  const closeList = () => {
    if (open) out.push(`</${open}>`);
    open = null;
  };

  for (const b of blocks) {
    if (b.type === "ul" || b.type === "ol") {
      if (open !== b.type) {
        closeList();
        out.push(`<${b.type}>`);
        open = b.type;
      }
      out.push(`<li class="i${b.indent}"${da}>${inlineHtml(b.text)}</li>`);
      continue;
    }
    closeList();
    if (b.type === "heading") out.push(`<h${b.level}${da}>${inlineHtml(b.text)}</h${b.level}>`);
    else if (b.type === "code") out.push(`<pre dir="ltr">${escapeHtml(b.text)}</pre>`);
    else out.push(`<p${da}>${inlineHtml(b.text)}</p>`);
  }
  closeList();

  return `<!doctype html>
<html lang="${lang}" dir="${rtl ? "rtl" : "ltr"}">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;600;700&family=Noto+Sans+Arabic:wght@400;600;700&family=Noto+Color+Emoji&display=swap" rel="stylesheet">
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: 'Heebo', 'Noto Sans Arabic', 'Segoe UI', Arial, sans-serif, 'Noto Color Emoji'; color: #1e1b3a; font-size: 11.5pt; line-height: 1.7; }
  .hero { background: linear-gradient(135deg, #1e1b4b 0%, #4c1d95 55%, #6d28d9 100%); color: #fff; padding: 26px 34px 22px; }
  .hero small { display: block; letter-spacing: .14em; text-transform: uppercase; font-size: 8.5pt; opacity: .75; margin-bottom: 4px; }
  .hero h1 { margin: 0; font-size: 21pt; line-height: 1.25; color: #fff; }
  .content { padding: 14px 34px 26px; }
  h1 { font-size: 17pt; color: #4c1d95; margin: 18px 0 8px; }
  h2 { font-size: 14pt; color: #5b21b6; margin: 20px 0 6px; padding-bottom: 4px; border-bottom: 2px solid #ddd6fe; break-after: avoid; }
  h3 { font-size: 12pt; color: #1d4ed8; margin: 14px 0 4px; break-after: avoid; }
  p { margin: 6px 0; }
  ul, ol { margin: 6px 0; padding-inline-start: 24px; }
  li { margin: 3px 0; }
  li.i1 { margin-inline-start: 22px; }
  strong { color: #111033; }
  code { font-family: Consolas, 'Courier New', monospace; font-size: 10pt; background: #ede9fe; color: #5b21b6; padding: 1px 5px; border-radius: 4px; direction: ltr; unicode-bidi: isolate; }
  pre { font-family: Consolas, 'Courier New', monospace; font-size: 9.5pt; background: #0f172a; color: #e2e8f0; padding: 12px 14px; border-radius: 10px; direction: ltr; text-align: left; white-space: pre-wrap; break-inside: avoid; }
  .foot { text-align: center; color: #8b87b0; font-size: 8.5pt; padding: 8px 0 18px; }
</style>
</head>
<body>
<div class="hero"><small>Private Tutor · StudyFeed</small><h1>${escapeHtml(title)}</h1></div>
<div class="content">${out.join("\n")}</div>
<div class="foot">Private Tutor · AI summary</div>
</body>
</html>`;
}

// ---------- PDF ----------

// chromium-min downloads this pack on first use in a serverless function (Linux x64 only)
const CHROMIUM_PACK_URL =
  process.env.CHROMIUM_PACK_URL ||
  "https://github.com/Sparticuz/chromium/releases/download/v153.0.0/chromium-v153.0.0-pack.x64.tar";

const LOCAL_BROWSERS = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean);

export async function toPdf(title, markdown, lang, htmlOptions) {
  const puppeteer = (await import("puppeteer-core")).default;
  const serverless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

  let launchOptions;
  const local = serverless ? null : LOCAL_BROWSERS.find((p) => fs.existsSync(p));
  if (local) {
    launchOptions = { executablePath: local, headless: true, args: ["--no-sandbox", "--disable-gpu"] };
  } else {
    const chromium = (await import("@sparticuz/chromium-min")).default;
    launchOptions = {
      executablePath: await chromium.executablePath(CHROMIUM_PACK_URL),
      args: chromium.args,
      headless: "shell",
    };
  }

  const browser = await puppeteer.launch(launchOptions);
  try {
    const page = await browser.newPage();
    const html = toHtml(title, markdown, lang, htmlOptions);
    try {
      // networkidle0 lets the Google Fonts (Hebrew / Arabic / emoji) finish loading
      await page.setContent(html, { waitUntil: "networkidle0", timeout: 15000 });
    } catch {
      await page.setContent(html, { waitUntil: "load" });
    }
    await page.evaluate(() => document.fonts.ready);
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "12mm", left: "0" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

// ---------- Word ----------

const FONT = "Arial";

// Word keeps separate properties for "complex script" text (Hebrew, Arabic): w:bCs / w:szCs and
// the bidirectional language. Without them bold and sizes are ignored on right-to-left runs.
const DOCX_LANG = { he: "he-IL", ar: "ar-SA", en: "en-US" };

function docxRuns(text, rtl, base = {}, lang = "en") {
  return inlineRuns(text).map((r) => {
    const bold = r.bold || base.bold;
    return new TextRun({
      text: r.text,
      bold,
      boldComplexScript: bold,
      color: r.code ? "5B21B6" : base.color,
      size: base.size,
      sizeComplexScript: base.size,
      font: r.code ? "Consolas" : FONT,
      rightToLeft: rtl,
      language: { value: DOCX_LANG.en, bidirectional: DOCX_LANG[lang] || DOCX_LANG.en },
    });
  });
}

export async function toDocx(title, markdown, lang) {
  const rtl = isRtl(lang);
  const start = rtl ? AlignmentType.START : AlignmentType.LEFT;
  const blocks = parseMarkdown(markdown);
  const children = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      bidirectional: rtl,
      alignment: start,
      spacing: { after: 240 },
      children: docxRuns(title, rtl, { bold: true, color: "4C1D95", size: 44 }, lang),
    }),
  ];

  const HEADINGS = {
    1: { heading: HeadingLevel.HEADING_1, size: 34, color: "4C1D95" },
    2: { heading: HeadingLevel.HEADING_2, size: 30, color: "5B21B6" },
    3: { heading: HeadingLevel.HEADING_3, size: 26, color: "1D4ED8" },
  };
  let olInstance = 0;
  let prev = null;

  for (const b of blocks) {
    if (b.type === "heading") {
      const h = HEADINGS[b.level];
      children.push(
        new Paragraph({
          heading: h.heading,
          bidirectional: rtl,
          alignment: start,
          spacing: { before: 280, after: 100 },
          keepNext: true,
          children: docxRuns(b.text, rtl, { bold: true, color: h.color, size: h.size }, lang),
        })
      );
    } else if (b.type === "ul") {
      children.push(
        new Paragraph({
          bullet: { level: b.indent },
          bidirectional: rtl,
          alignment: start,
          spacing: { after: 60 },
          children: docxRuns(b.text, rtl, { size: 23 }, lang),
        })
      );
    } else if (b.type === "ol") {
      if (prev !== "ol") olInstance += 1; // a new list restarts at 1
      children.push(
        new Paragraph({
          numbering: { reference: "ol", level: b.indent, instance: olInstance },
          bidirectional: rtl,
          alignment: start,
          spacing: { after: 60 },
          children: docxRuns(b.text, rtl, { size: 23 }, lang),
        })
      );
    } else if (b.type === "code") {
      for (const line of b.text.split("\n")) {
        children.push(
          new Paragraph({
            shading: { type: ShadingType.CLEAR, fill: "EEF2F7", color: "auto" },
            alignment: AlignmentType.LEFT,
            spacing: { after: 0 },
            children: [new TextRun({ text: line || " ", font: "Consolas", size: 20 })],
          })
        );
      }
    } else {
      children.push(
        new Paragraph({
          bidirectional: rtl,
          alignment: start,
          spacing: { after: 120, line: 320 },
          children: docxRuns(b.text, rtl, { size: 23 }, lang),
        })
      );
    }
    prev = b.type;
  }

  const levels = [0, 1].map((level) => ({
    level,
    format: "decimal",
    text: `%${level + 1}.`,
    alignment: AlignmentType.START,
  }));

  const doc = new Document({
    creator: "Private Tutor",
    title,
    numbering: { config: [{ reference: "ol", levels }] },
    styles: { default: { document: { run: { font: FONT, size: 23 } } } },
    sections: [{ children }],
  });
  return Packer.toBuffer(doc);
}

// ---------- shared ----------

export const EXPORT_FORMATS = {
  pdf: { ext: "pdf", mime: "application/pdf", make: toPdf },
  word: {
    ext: "docx",
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    make: toDocx,
  },
};

export async function buildExport(format, title, markdown, lang) {
  const spec = EXPORT_FORMATS[format];
  if (!spec) throw new Error(`Unknown format: ${format}`);
  const buffer = await spec.make(title, markdown, lang);
  const safe = String(title).replace(/[\\/:*?"<>|\r\n]+/g, "_").trim().slice(0, 80) || "summary";
  return {
    name: `${safe}-summary.${spec.ext}`,
    mime: spec.mime,
    base64: Buffer.from(buffer).toString("base64"),
  };
}
