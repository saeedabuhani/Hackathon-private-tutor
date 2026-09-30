import crypto from "node:crypto";

// A code challenge is written by the AI and then sent to the browser and back. Signing it means the
// server can tell, when the code comes back for checking, that the challenge (and above all its
// difficulty, which decides the XP) is the one it created, not something edited in the browser.
// The secret never leaves the server.
function secret() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.ADMIN_API_KEY;
  if (!key) throw new Error("Server secret is not configured");
  return key;
}

const payload = (userId, c) => JSON.stringify([userId, c.title, c.description, c.difficulty, c.language]);

export function signChallenge(userId, challenge) {
  return crypto.createHmac("sha256", secret()).update(payload(userId, challenge)).digest("hex");
}

export function verifyChallenge(userId, challenge, token) {
  if (typeof token !== "string" || token.length !== 64) return false;
  const expected = Buffer.from(signChallenge(userId, challenge));
  const given = Buffer.from(token);
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}
