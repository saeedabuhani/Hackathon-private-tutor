import { createClient } from '@supabase/supabase-js';

// Trim: stray whitespace in .env.local breaks the URL and causes "Failed to fetch"
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

// Browser / anon client (respects RLS)
export const supabase = createClient(
  url || 'http://localhost:54321',
  anonKey || 'missing-anon-key'
);

// Server-only admin client (bypasses RLS) — use in API routes only
export function getSupabaseAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}
