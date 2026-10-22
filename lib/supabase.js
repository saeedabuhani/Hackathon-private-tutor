import { createClient } from '@supabase/supabase-js';
import { createDemoSupabase, installDemo } from '@/lib/demo/install';

const DEMO = process.env.NEXT_PUBLIC_DEMO === 'true';

// Trim: stray whitespace in .env.local breaks the URL and causes "Failed to fetch"
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

// Browser / anon client (respects RLS)
// In the static demo build there is no Supabase: a stub client and a fake /api layer take over.
if (DEMO && typeof window !== 'undefined') installDemo();
export const supabase = DEMO
  ? createDemoSupabase()
  : createClient(url || 'http://localhost:54321', anonKey || 'missing-anon-key');

// Server-only admin client (bypasses RLS) — use in API routes only
export function getSupabaseAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}
