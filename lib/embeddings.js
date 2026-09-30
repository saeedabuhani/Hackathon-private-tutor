import { getOpenAI, EMBEDDING_MODEL, OPENAI_MODEL, TEMPERATURE } from "@/lib/openai";

const BATCH_SIZE = 50;

// Embed a list of strings, returns an array of 1536-dim vectors in the same order
export async function embedTexts(texts) {
  const openai = getOpenAI();
  const vectors = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const res = await openai.embeddings.create({ model: EMBEDDING_MODEL, input: batch });
    vectors.push(...res.data.map((d) => d.embedding));
  }
  return vectors;
}

export async function embedText(text) {
  const [vector] = await embedTexts([text]);
  return vector;
}

// Ask GPT-4o for the main topics of a material
export async function extractTopics(text) {
  const openai = getOpenAI();
  const res = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: TEMPERATURE,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "user",
        content: `List the main topics in this text as a JSON array of strings. Respond as JSON: {"topics": ["..."]}\n\n${text.slice(0, 12000)}`,
      },
    ],
  });
  try {
    const parsed = JSON.parse(res.choices[0].message.content);
    return Array.isArray(parsed.topics) ? parsed.topics.map(String).slice(0, 15) : [];
  } catch {
    return [];
  }
}
