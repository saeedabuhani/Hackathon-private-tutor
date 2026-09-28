// Split text into overlapping chunks for RAG
export function chunkText(text, chunkSize = 500, overlap = 50) {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks = [];
  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    chunks.push(words.slice(i, i + chunkSize).join(' '));
    if (i + chunkSize >= words.length) break;
  }
  return chunks;
}

// Detect language from text (no API call needed)
export function detectLanguage(text) {
  const hasArabic = /[؀-ۿ]/.test(text);
  const hasHebrew = /[֐-׿]/.test(text);
  if (hasArabic && hasHebrew) return 'mixed';
  if (hasArabic) return 'ar';
  if (hasHebrew) return 'he';
  return 'en';
}

// RAG: find closest chunks in Supabase using pgvector
export async function searchChunks(supabaseAdmin, materialId, queryEmbedding, limit = 5) {
  const { data } = await supabaseAdmin.rpc('match_chunks', {
    query_embedding: queryEmbedding,
    match_material_id: materialId,
    match_count: limit,
  });
  return data || [];
}
