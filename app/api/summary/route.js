import { NextResponse } from "next/server";
import { requireAdmin, ownsMaterial, askText } from "@/lib/server";

export const runtime = "nodejs";
export const maxDuration = 60;

// gpt-4o's context is 128k tokens, but we keep this well under that for cost/speed.
// Full "smart chunking" for very large files is a later improvement, not done here.
const MAX_SUMMARY_CHARS = 24000;

const SUMMARY_PROMPT = `אתה מומחה לסיכום חומרי לימוד.
סכם את החומר הבא בצורה ברורה ומסודרת.

מבנה הסיכום (חובה לעקוב):

# 📚 סיכום: [שם הנושא]

## 🎯 על מה מדובר (2-3 משפטים)
הסבר קצר שילד יבין על מה החומר.

## 📌 נושאים מרכזיים
לכל נושא:
### [שם הנושא]
- הגדרה פשוטה
- דוגמה קצרה
- למה זה חשוב

## 💡 הדברים הכי חשובים לזכור
רשימה של 5-7 נקודות מפתח

## ❓ שאלות שכנראה יהיו במבחן
3-5 שאלות על הנושאים המרכזיים

## 🔗 קשרים בין נושאים
איך הנושאים קשורים אחד לשני

Language: ענה בשפת החומר שקיבלת (Hebrew, Arabic or English) — translate this
structure's headers into that language too, keep the emojis.
הסיכום צריך להיות מספיק ברור שמי שלא קרא את החומר יבין הכל!
NEVER invent facts that aren't in the material below.`;

// POST { materialId, userId } -> { title, summary } (summary is Markdown)
export async function POST(request) {
  try {
    const { materialId, userId } = await request.json();
    if (!materialId || !userId) {
      return NextResponse.json({ error: "materialId and userId are required" }, { status: 400 });
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
    if (!material.content) {
      return NextResponse.json({ error: "This material has no extracted text" }, { status: 422 });
    }

    const summary = await askText(SUMMARY_PROMPT, material.content.slice(0, MAX_SUMMARY_CHARS), {
      maxTokens: 2000,
    });

    return NextResponse.json({ title: material.title, summary });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
