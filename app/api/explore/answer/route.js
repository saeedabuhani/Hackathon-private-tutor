import { NextResponse } from "next/server";
import { requireAdmin, addXP, askJson, LANG_NAMES } from "@/lib/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const CORRECT_XP = 10;
// Every topic in the catalog; used to pick a fresh one after a correct answer
const TOPICS = ["JavaScript", "React", "CSS", "Git", "API", "Database", "Node.js", "HTML", "Python", "TypeScript", "Docker", "SQL"];

function pickNextTopic(currentTopic) {
  const others = TOPICS.filter((t) => t !== currentTopic);
  return others[Math.floor(Math.random() * others.length)] || currentTopic;
}

// A short AI explanation of the right answer, shown only when the student got it wrong
async function explainAnswer({ question, correctAnswerText, lang }) {
  if (!question || !correctAnswerText) return "";
  const language = LANG_NAMES[lang] || "English";
  try {
    const result = await askJson(
      `Explain in ${language}, in 2-3 short sentences, why "${correctAnswerText}" is the correct answer to: "${question}". Respond as JSON: {"explanation": "..."}`,
      "Explain briefly."
    );
    return result.explanation || "";
  } catch {
    return "";
  }
}

// POST { videoId, userId, topic, isCorrect, lang, question?, correctAnswerText? }
// isCorrect: true  -> +10 XP, saved, returns a new random topic
// isCorrect: false -> saved, returns the same topic + a short AI explanation
export async function POST(request) {
  try {
    const { videoId, userId, topic, isCorrect, lang, question, correctAnswerText } = await request.json();
    if (!videoId || !userId || !topic || typeof isCorrect !== "boolean") {
      return NextResponse.json(
        { error: "videoId, userId, topic and isCorrect are required" },
        { status: 400 }
      );
    }

    const admin = requireAdmin();

    await admin.from("explore_attempts").insert({ user_id: userId, video_id: videoId, topic, is_correct: isCorrect });

    if (isCorrect) {
      const { data: video } = await admin
        .from("explore_videos")
        .select("times_correct")
        .eq("id", videoId)
        .maybeSingle();
      if (video) {
        await admin
          .from("explore_videos")
          .update({ times_correct: (video.times_correct || 0) + 1 })
          .eq("id", videoId);
      }
      const newTotal = await addXP(admin, userId, CORRECT_XP);
      return NextResponse.json({ correct: true, newTotal, nextTopic: pickNextTopic(topic) });
    }

    const explanation = await explainAnswer({ question, correctAnswerText, lang });
    return NextResponse.json({ correct: false, sameTopic: topic, explanation });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
