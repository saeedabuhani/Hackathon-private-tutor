import { NextResponse } from "next/server";
import { extractText, VISION_FALLBACK_MESSAGE } from "@/lib/extract";
import { getSupabaseAdmin } from "@/lib/supabase";
import { chunkText } from "@/lib/utils";
import { embedTexts, extractTopics } from "@/lib/embeddings";

export const runtime = "nodejs";
export const maxDuration = 60;

// GET: list the user's materials, or one material with ?materialId=
export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const userId = params.get("userId");
  const materialId = params.get("materialId");
  const admin = getSupabaseAdmin();
  if (!admin || !userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  if (materialId) {
    const { data, error } = await admin
      .from("materials")
      .select("id, title, topics, file_type, created_at")
      .eq("id", materialId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Material not found" }, { status: 404 });
    return NextResponse.json({ material: data });
  }

  const { data, error } = await admin
    .from("materials")
    .select("id, title, topics, file_type, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ materials: data });
}

// POST: upload -> extract text -> chunk -> embed -> save -> extract topics
export async function POST(request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const title = form.get("title") || file?.name || "Untitled";
    const userId = form.get("userId");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    let extracted;
    try {
      extracted = await extractText(buffer, file.name);
    } catch (err) {
      const isImage = /\.(png|jpe?g|webp)$/i.test(file.name);
      return NextResponse.json(
        { error: isImage ? VISION_FALLBACK_MESSAGE : err.message },
        { status: 422 }
      );
    }

    const { fileType, text } = extracted;
    if (!text) {
      return NextResponse.json(
        {
          error:
            fileType === "image"
              ? VISION_FALLBACK_MESSAGE
              : "No text could be extracted from this file",
        },
        { status: 422 }
      );
    }

    const admin = getSupabaseAdmin();
    if (!admin || !userId) {
      return NextResponse.json({ error: "Missing userId or Supabase config" }, { status: 400 });
    }

    const { data: material, error: insertError } = await admin
      .from("materials")
      .insert({ user_id: userId, title, content: text, file_type: fileType })
      .select("id")
      .single();
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
    const materialId = material.id;

    // Embeddings for RAG
    const chunks = chunkText(text);
    const vectors = await embedTexts(chunks);
    const rows = chunks.map((chunk, i) => ({
      material_id: materialId,
      chunk_text: chunk,
      chunk_index: i,
      embedding: vectors[i],
    }));
    const { error: embedError } = await admin.from("embeddings").insert(rows);
    if (embedError) {
      await admin.from("materials").delete().eq("id", materialId);
      return NextResponse.json({ error: embedError.message }, { status: 500 });
    }

    // Topics
    const topics = await extractTopics(text);
    await admin.from("materials").update({ topics }).eq("id", materialId);

    return NextResponse.json({
      materialId,
      title,
      fileType,
      topics,
      chunksCount: chunks.length,
      preview: text.slice(0, 2000),
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
