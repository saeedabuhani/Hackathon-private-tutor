"use client";

import { supabase } from "@/lib/supabase";

// fetch() that sends the signed-in user's Supabase access token, so the server can tell
// who is asking (see requireUser in lib/server.js).
export async function authFetch(url, options = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}
