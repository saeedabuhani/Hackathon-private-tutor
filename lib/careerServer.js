import { NextResponse } from "next/server";
import { HttpError, complete } from "@/lib/server";

// Small helpers shared by the /api/career routes

export function fail(err) {
  const status = err instanceof HttpError ? err.status : 500;
  return NextResponse.json({ error: err.message || "Something went wrong" }, { status });
}

// A Supabase error -> HttpError (with a clear hint when the career tables were never created)
export function dbCheck(error) {
  if (!error) return;
  const missing = error.code === "PGRST205" || /schema cache|does not exist/i.test(error.message || "");
  throw new HttpError(
    missing ? 503 : 500,
    missing ? "The career tables are missing. Run the career SQL in the Supabase SQL Editor." : error.message
  );
}

export async function readBody(request) {
  try {
    const body = await request.json();
    if (body && typeof body === "object") return body;
  } catch {
    // falls through
  }
  throw new HttpError(400, "The request body must be JSON");
}

// One GPT call that must return JSON that `clean` accepts; asks once more if the shape is wrong
export async function askClean({ system, user }, clean, { tries = 2, maxTokens = 1800, temperature = 0.4 } = {}) {
  for (let i = 0; i < tries; i++) {
    const content = await complete(
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      { json: true, temperature, maxTokens }
    );
    let raw = null;
    try {
      raw = JSON.parse(content);
    } catch {
      // try again
    }
    const result = raw ? clean(raw) : null;
    if (result) return result;
  }
  throw new HttpError(502, "The AI returned an incomplete answer. Try again.");
}
