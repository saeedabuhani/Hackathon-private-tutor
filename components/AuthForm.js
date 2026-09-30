"use client";

import "./auth/auth.css";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "@/lib/translations";
import PreferencesControls from "@/components/layout/PreferencesControls";
import AquariumCanvas from "@/components/aquarium/AquariumCanvas";
import { LeviathanMark } from "@/components/layout/Brand";

// Design-only copy for this screen, in the three site languages
const TAGLINE = {
  en: "Your material. Your tutor.",
  he: "החומר שלך. המורה שלך.",
  ar: "مادتك. معلّمك.",
};

const ICON = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" };
const Icons = {
  user: (
    <svg {...ICON}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </svg>
  ),
  mail: (
    <svg {...ICON}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="3" />
      <path d="m4.5 7.5 7.5 6 7.5-6" />
    </svg>
  ),
  lock: (
    <svg {...ICON}>
      <rect x="5" y="10.5" width="14" height="9.5" rx="3" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </svg>
  ),
};

// The screws of the submarine window: four corners, the middle of each side, and two more on the
// top and bottom (each sits in the 9px steel frame)
const RIVETS = [
  { top: 1, left: 1 }, { top: 1, right: 1 }, { bottom: 1, left: 1 }, { bottom: 1, right: 1 },
  { top: 1, left: "50%", marginLeft: -3.5 }, { bottom: 1, left: "50%", marginLeft: -3.5 },
  { left: 1, top: "50%", marginTop: -3.5 }, { right: 1, top: "50%", marginTop: -3.5 },
  { top: 1, left: "25%" }, { top: 1, left: "75%" }, { bottom: 1, left: "25%" }, { bottom: 1, left: "75%" },
];

// Tell the aquarium what the form is doing (see components/aquarium/AquariumCanvas.js)
const fx = (type) => window.dispatchEvent(new CustomEvent("auth-fx", { detail: { type } }));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function AuthForm({ mode }) {
  const router = useRouter();
  const { t, lang } = useTranslation();
  const isRegister = mode === "register";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  // idle | charging (waiting for the server) | error | launch (signed in, leaving)
  const [phase, setPhase] = useState("idle");
  const tiltRef = useRef(null);

  useEffect(() => {
    router.prefetch("/feed");
  }, [router]);

  // The card leans toward the mouse and the light on the glass follows it.
  // The loop rests as soon as it has caught up, and is off on touch screens / reduced motion.
  useEffect(() => {
    const el = tiltRef.current;
    if (!el) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || window.matchMedia("(hover: none)").matches) {
      return undefined;
    }
    let raf = 0;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    function tick() {
      cx += (tx - cx) * 0.11;
      cy += (ty - cy) * 0.11;
      el.style.setProperty("--rx", `${cy.toFixed(2)}deg`);
      el.style.setProperty("--ry", `${cx.toFixed(2)}deg`);
      raf = Math.abs(tx - cx) > 0.01 || Math.abs(ty - cy) > 0.01 ? requestAnimationFrame(tick) : 0;
    }
    function onMove(e) {
      tx = (e.clientX / window.innerWidth - 0.5) * 2 * 7;
      ty = -(e.clientY / window.innerHeight - 0.5) * 2 * 5;
      const box = el.getBoundingClientRect();
      el.style.setProperty("--sx", `${Math.max(0, Math.min(100, ((e.clientX - box.left) / box.width) * 100)).toFixed(1)}%`);
      el.style.setProperty("--sy", `${Math.max(0, Math.min(100, ((e.clientY - box.top) / box.height) * 100)).toFixed(1)}%`);
      if (!raf) raf = requestAnimationFrame(tick);
    }
    function onLeave() {
      tx = 0;
      ty = 0;
      if (!raf) raf = requestAnimationFrame(tick);
    }
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    setPhase("charging");
    fx("charge");
    try {
      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        });
        if (error) throw error;
        if (!data.session) {
          setInfo(t.checkEmail);
          setPhase("idle");
          fx("idle");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      // Signed in: a short warp through the constellation, then on to the app
      setPhase("launch");
      fx("success");
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      await sleep(reduced ? 0 : 950);
      router.replace("/feed");
    } catch (err) {
      setError(err.message);
      setPhase("error");
      fx("error");
      setTimeout(() => setPhase((p) => (p === "error" ? "idle" : p)), 700);
    } finally {
      setLoading(false);
    }
  }

  const title = isRegister ? t.register : t.login;
  const words = title.split(" ");
  const launching = phase === "launch";
  let rise = 0;
  const next = () => ({ "--i": rise++ });

  return (
    <>
      <div className="auth-scene" aria-hidden="true">
        <AquariumCanvas variant="login" />
        <div className="auth-vignette" />
      </div>

      <main className="auth-page auth-sea">
        <div className="auth-top">
          <PreferencesControls />
        </div>

        <div className={`auth-enter ${phase === "charging" ? "is-charging" : ""} ${phase === "error" ? "is-error" : ""} ${launching ? "is-launch" : ""}`}>
          {/* the shake and the launch play on this wrapper, so they never restart the card's entrance */}
          <div className="auth-state">
          <div className="auth-float">
            <div ref={tiltRef} className="auth-tilt">
              <form onSubmit={handleSubmit} className="auth-shell">
                <span className="auth-glass" aria-hidden="true" />
                <span className="auth-glow" aria-hidden="true" />
                <span className="auth-ring" aria-hidden="true" />
                <span className="auth-rivets" aria-hidden="true">
                  {RIVETS.map((r, i) => (
                    <i key={i} style={r} />
                  ))}
                </span>

                <div className="auth-content space-y-4">
                  <div className="auth-brand rise" style={next()}>
                    <span className="auth-mark" aria-hidden="true">
                      <LeviathanMark size={60} />
                    </span>
                    <div>
                      <div className="auth-word text-neon">Leviathan</div>
                      <div className="auth-tag">{TAGLINE[lang] || TAGLINE.en}</div>
                    </div>
                  </div>

                  <h1 className="auth-title text-neon">
                    {words.map((word, i) => (
                      <span key={i} className="word" style={{ "--w": i }}>
                        {word}
                      </span>
                    ))}
                  </h1>

                  {isRegister && (
                    <label className="auth-field rise" style={next()}>
                      {Icons.user}
                      <input
                        className="auth-input"
                        placeholder={t.name}
                        autoComplete="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </label>
                  )}
                  <label className="auth-field rise" style={next()}>
                    {Icons.mail}
                    <input
                      className="auth-input"
                      type="email"
                      placeholder={t.email}
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </label>
                  <label className="auth-field rise" style={next()}>
                    {Icons.lock}
                    <input
                      className="auth-input"
                      type="password"
                      placeholder={t.password}
                      autoComplete={isRegister ? "new-password" : "current-password"}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </label>

                  {error && (
                    <p role="alert" className="auth-msg err">
                      {error}
                    </p>
                  )}
                  {info && (
                    <p role="status" className="auth-msg ok">
                      {info}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading || launching}
                    className={`auth-btn rise ${loading && !launching ? "is-loading" : ""} ${launching ? "is-done" : ""}`}
                    style={next()}
                  >
                    <span className="label">{isRegister ? t.registerSubmit : t.login}</span>
                    <span className="spin" aria-hidden="true">
                      <i className="auth-spin-ring" />
                    </span>
                    <span className="done" aria-hidden="true">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m5 12.5 4.5 4.5L19 7.5" />
                      </svg>
                    </span>
                  </button>

                  <p className="auth-switch rise" style={next()}>
                    {isRegister ? t.haveAccount : t.noAccount}{" "}
                    <Link href={isRegister ? "/login" : "/register"}>{isRegister ? t.login : t.registerSubmit}</Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
          </div>
        </div>

        <div className="auth-chips" aria-hidden="true">
          <span className="auth-chip">🧠 {t.tutor}</span>
          <span className="auth-chip">🎬 {t.explore}</span>
          <span className="auth-chip">🤖 {t.aiStudies}</span>
        </div>
      </main>
    </>
  );
}
