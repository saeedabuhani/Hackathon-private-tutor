// Static demo mode (NEXT_PUBLIC_DEMO=true): replaces the network and the video player.
// Every /api request is answered from lib/demo/fixtures.js. No server, no keys, nothing is sent anywhere.
import * as fx from "./fixtures";

let installed = false;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function pdfResponse() {
  // A tiny valid PDF so "Download my summary" works in the demo.
  const text = "%PDF-1.1\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 100]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n4 0 obj<</Length 60>>stream\nBT /F1 12 Tf 20 50 Td (Leviathan demo summary - sample data) Tj ET\nendstream endobj\n5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\ntrailer<</Root 1 0 R/Size 6>>\n%%EOF";
  return new Response(text, { status: 200, headers: { "Content-Type": "application/pdf" } });
}

function route(url, method, body) {
  const u = new URL(url, window.location.origin);
  const p = u.pathname;
  const q = u.searchParams;

  if (p === "/api/materials") {
    if (method === "POST") {
      return json({ error: "Uploading is disabled in the public demo. Open one of the sample materials instead." }, 400);
    }
    const id = q.get("materialId");
    if (id) {
      const material = fx.materials.find((m) => m.id === id);
      return material ? json({ material }) : json({ error: "Material not found" }, 404);
    }
    return json({ materials: fx.materials });
  }
  if (/^\/api\/materials\/[^/]+$/.test(p)) return json({ error: "Deleting is disabled in the public demo." }, 403);
  if (p === "/api/sessions") {
    if (method === "POST") return json({ sessionId: "s-" + Date.now() }, 201);
    return json({ sessions: fx.sessions });
  }
  let m = /^\/api\/sessions\/([^/]+)\/messages$/.exec(p);
  if (m) {
    if (method === "POST") return json({ id: "m-" + Date.now() }, 201);
    return json({ messages: fx.messages[m[1]] || [] });
  }
  if (/^\/api\/sessions\/[^/]+$/.test(p)) return json({ ok: true });
  if (p === "/api/stuck") return json(fx.stuckAnswer);
  if (p === "/api/gap-map") return method === "GET" ? json({ gaps: fx.gaps }) : json({ gap: fx.gaps[0] });
  if (p === "/api/exam") return json(fx.examQuestion);
  if (p === "/api/exam/translate") return json(fx.examQuestion);
  if (p === "/api/hint") return json(fx.hintResult);
  if (p === "/api/summary") {
    return json({
      summary:
        "## Summary (demo)\n- Arrays are ordered lists indexed from 0.\n- Functions are reusable blocks of code.\n- `async/await` is syntax over Promises.\n- Closures keep access to the scope where they were created.",
    });
  }
  if (p === "/api/xp") return json({ newTotal: 60 + (body?.points || 0) });
  if (p === "/api/feed") return json({ videos: fx.feedVideos, errors: [] });
  if (p === "/api/feed/question") return json(fx.feedQuestion);
  if (p === "/api/explore/videos") return json({ video: fx.exploreVideos[Math.floor(Math.random() * fx.exploreVideos.length)] });
  if (p === "/api/explore/question") return json(fx.exploreQuestion);
  if (p === "/api/explore/answer") {
    return body?.isCorrect
      ? json({ correct: true, newTotal: 70, nextTopic: "Git" })
      : json({ correct: false, sameTopic: body?.topic || "JavaScript", explanation: "A Promise stands for a value that will be available later." });
  }
  if (p === "/api/ai-videos") return json({ videos: fx.aiVideos });
  if (p === "/api/career/profile") return method === "GET" ? json({ profile: fx.careerProfile }) : json({ profile: { ...fx.careerProfile, ...(body || {}) } });
  if (p === "/api/career/jobs") return json({ kit: fx.jobsKit });
  if (p === "/api/career/interview") return typeof body?.userAnswer === "string" ? json(fx.interviewFeedback) : json(fx.interviewQuestion);
  if (p === "/api/career/challenge") {
    return body?.userCode !== undefined
      ? json(fx.challengeReview)
      : json({ ...fx.challenge, difficulty: body?.difficulty || "easy", language: body?.language || "javascript" });
  }
  if (p === "/api/career/summary") return pdfResponse();
  return json({ error: "Not available in the demo" }, 404);
}

export function installDemo() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  const realFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const pathname = new URL(url, window.location.origin).pathname;
    if (!pathname.startsWith("/api/")) return realFetch(input, init);
    const method = (init.method || (typeof input !== "string" && input.method) || "GET").toUpperCase();
    let body = null;
    if (typeof init.body === "string") {
      try {
        body = JSON.parse(init.body);
      } catch {
        body = null;
      }
    }
    await new Promise((r) => setTimeout(r, 350)); // a little latency so loading states are visible
    return route(url, method, body);
  };

  // Fake YouTube IFrame API: shows a placeholder instead of loading youtube.com.
  const listeners = new Set();
  class FakePlayer {
    constructor(mount, opts) {
      this.opts = opts;
      this.box = document.createElement("div");
      this.box.style.cssText =
        "position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:linear-gradient(135deg,#0b2545,#13315c);color:#cfe3ff;font:14px system-ui,sans-serif;text-align:center;padding:16px";
      this.box.innerHTML =
        '<div style="font-size:42px">▶</div><div>Demo mode: video playback is disabled</div><div style="opacity:.7;font-size:12px">The live app plays short YouTube explainers here</div>';
      mount.appendChild(this.box);
      listeners.add(this);
      setTimeout(() => this.opts?.events?.onReady?.({ target: this }), 0);
    }
    playVideo() {
      clearTimeout(this.t);
      this.opts?.events?.onStateChange?.({ data: 1 });
      this.t = setTimeout(() => this.opts?.events?.onStateChange?.({ data: 0 }), 6000);
    }
    pauseVideo() { clearTimeout(this.t); this.opts?.events?.onStateChange?.({ data: 2 }); }
    stopVideo() { clearTimeout(this.t); }
    seekTo() {}
    getCurrentTime() { return 0; }
    getDuration() { return 60; }
    mute() {}
    unMute() {}
    setVolume() {}
    loadVideoById() { this.playVideo(); }
    cueVideoById() {}
    destroy() { clearTimeout(this.t); this.box.remove(); listeners.delete(this); }
  }
  window.YT = { Player: FakePlayer, PlayerState: { ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 } };

  const banner = document.createElement("div");
  banner.setAttribute("role", "status");
  banner.style.cssText =
    "position:fixed;bottom:0;left:0;right:0;z-index:99999;background:#0f172a;color:#fff;font:13px/1.4 system-ui,sans-serif;padding:8px 14px;text-align:center;pointer-events:none";
  banner.innerHTML =
    'Demo mode – sample data, no AI or database behind it, nothing is saved. <a style="color:#7dd3fc;pointer-events:auto" href="https://github.com/saeedabuhani/Hackathon-private-tutor">Source on GitHub</a>';
  // Added after hydration: touching <body> earlier makes React report a hydration mismatch.
  const show = () => setTimeout(() => document.body.appendChild(banner), 1500);
  if (document.readyState === "complete") show();
  else window.addEventListener("load", show);
}

// Minimal stand-in for the Supabase client: always signed in as the demo user.
export function createDemoSupabase() {
  const session = { access_token: "demo", user: fx.DEMO_USER };
  const query = (table) => {
    const q = {
      select: () => q,
      eq: () => q,
      order: () => q,
      limit: () => q,
      maybeSingle: async () => ({ data: table === "users" ? { xp: 60 } : null, error: null }),
      single: async () => ({ data: null, error: null }),
      then: (res) => res({ data: [], error: null }),
    };
    return q;
  };
  return {
    auth: {
      getSession: async () => ({ data: { session }, error: null }),
      signInWithPassword: async () => ({ data: { session }, error: null }),
      signUp: async () => ({ data: { session }, error: null }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    },
    from: query,
  };
}
