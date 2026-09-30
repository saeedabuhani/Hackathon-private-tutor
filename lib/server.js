import { getSupabaseAdmin } from "@/lib/supabase";
import { getOpenAI, OPENAI_MODEL, TEMPERATURE } from "@/lib/openai";
import { embedText } from "@/lib/embeddings";
import { searchChunks } from "@/lib/utils";

export const LANG_NAMES = { he: "Hebrew", ar: "Arabic", en: "English" };

// Returns the admin client, or throws if Supabase is not configured
export function requireAdmin() {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase is not configured");
  return admin;
}

// An error that carries the HTTP status a route should answer with
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Identify the caller from the Supabase access token the browser sends as
// `Authorization: Bearer <token>` (see lib/authFetch.js). Unlike a userId in the body,
// this can't be spoofed, so use it for private data and destructive actions.
export async function requireUser(request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!token) throw new HttpError(401, "Not signed in");
  const admin = requireAdmin();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) throw new HttpError(401, "Invalid or expired session");
  return { admin, userId: data.user.id };
}

// Turn a Supabase error into an HttpError (with a hint when the chat tables don't exist yet)
export function throwDb(error) {
  if (!error) return;
  const missing = error.code === "PGRST205" || /schema cache|does not exist/i.test(error.message || "");
  throw new HttpError(
    missing ? 503 : 500,
    missing
      ? "Chat history tables are missing — run supabase/add-chat-history.sql in the Supabase SQL Editor."
      : error.message
  );
}

// The session row if it belongs to the user, otherwise a 404
export async function getOwnedSession(admin, sessionId, userId) {
  const { data, error } = await admin
    .from("chat_sessions")
    .select("id, material_id")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();
  throwDb(error);
  if (!data) throw new HttpError(404, "Conversation not found");
  return data;
}

// True when the material exists and belongs to the user
export async function ownsMaterial(admin, materialId, userId) {
  const { data } = await admin
    .from("materials")
    .select("id")
    .eq("id", materialId)
    .eq("user_id", userId)
    .maybeSingle();
  return Boolean(data);
}

// RAG: top chunks of a material for a piece of text, joined as prompt context
export async function getContext(admin, materialId, text, limit = 5) {
  const embedding = await embedText(text);
  const found = await searchChunks(admin, materialId, embedding, limit);
  return found.map((c, i) => `[Chunk ${i + 1}]\n${c.chunk_text}`).join("\n\n");
}

// Low-level chat completion. `messages` is the full array (system + history + user),
// so callers that need multi-turn context (like /api/stuck) can use it directly.
export async function complete(messages, { temperature = TEMPERATURE, maxTokens, json = false } = {}) {
  const openai = getOpenAI();
  const res = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    temperature,
    ...(maxTokens ? { max_tokens: maxTokens } : {}),
    ...(json ? { response_format: { type: "json_object" } } : {}),
    messages,
  });
  return res.choices[0].message.content;
}

// One GPT-4o call that must return a JSON object
export async function askJson(system, user) {
  const content = await complete(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    { json: true }
  );
  return JSON.parse(content);
}

// One GPT-4o call that returns plain text (e.g. a Markdown summary)
export async function askText(system, user, opts) {
  return complete(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    opts
  );
}

// Add XP to a user, returns the new total. Shared by /api/xp and /api/explore/answer.
export async function addXP(admin, userId, points) {
  const { data: user, error: readError } = await admin
    .from("users")
    .select("xp")
    .eq("id", userId)
    .maybeSingle();
  if (readError) throw new Error(readError.message);
  if (!user) throw new Error("User not found");

  const newTotal = (user.xp || 0) + points;
  const { error: writeError } = await admin
    .from("users")
    .update({ xp: newTotal })
    .eq("id", userId);
  if (writeError) throw new Error(writeError.message);
  return newTotal;
}

// Fold a new score (0-100) into the running average for a topic
export async function updateGapMap(admin, { userId, materialId, topic, score }) {
  const { data: existing } = await admin
    .from("gap_map")
    .select("score_avg, attempts_count, stuck_count")
    .eq("user_id", userId)
    .eq("material_id", materialId)
    .eq("topic", topic)
    .maybeSingle();

  const attempts = existing?.attempts_count || 0;
  const avg = existing?.score_avg || 0;
  const { data, error } = await admin
    .from("gap_map")
    .upsert(
      {
        user_id: userId,
        material_id: materialId,
        topic,
        score_avg: (avg * attempts + score) / (attempts + 1),
        attempts_count: attempts + 1,
        stuck_count: existing?.stuck_count || 0,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,material_id,topic" }
    )
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}
