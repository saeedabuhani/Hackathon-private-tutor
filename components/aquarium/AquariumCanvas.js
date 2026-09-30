"use client";

import "./sea.css";
import { useEffect, useRef } from "react";
import { VARIANTS } from "./variants";
import { buildFishAtlas, drawFish, buildBubble, FISH_W } from "./sprites";
import { SCENES } from "./scenes";

// One shared aquarium, drawn on a single canvas with 2D drawing only (no 3D library):
//   <AquariumCanvas variant="login | feed | tutor | explore | ai-studies" />
// Depth is faked the way a real tank looks: far things are smaller, slower and dimmer, and the
// camera drifts with the mouse a little more for what is near.
//
// Rules (from AQUARIUM_DESIGN.md): the canvas sits behind the content and is aria-hidden; the loop
// stops when the tab is hidden; under reduced motion only a still blue background with soft light
// is drawn; fish are small vector sprites cut once on offscreen canvases, at most 20 creatures at
// once (fish + the variant's special animals), plus bubbles which are cheap particles.
//
// Events other parts of the app can send (window CustomEvents):
//   auth-fx         { type: "charge" | "idle" | "error" | "success" }   the login form's states
//   aquarium-bubbles{ x, y, count, big }                                a burst of bubbles at a point
//   aquarium-look   { rect } | { rect: null }                            a fish comes to look at a card
//   aquarium-spot   { rect }                                            a beam of light lands on a box

const TAU = Math.PI * 2;
const rnd = (a, b) => a + Math.random() * (b - a);
const lerp = (a, b, k) => a + (b - a) * k;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export default function AquariumCanvas({ variant = "login" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;
    const cfg = VARIANTS[variant] || VARIANTS.login;

    const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mqSmall = window.matchMedia("(max-width: 720px), (pointer: coarse)");
    let reduced = mqReduce.matches;

    // ---- the world every drawing function shares ----
    const W = {
      ctx, cfg, variant,
      w: 0, h: 0, dpr: 1, t: 0, dt: 0,
      small: mqSmall.matches,
      light: false,
      mx: 0.5, my: 0.5, sx: 0.5, sy: 0.5, px: -9999, py: -9999,
      fx: { charge: 0, chargeTarget: 0, tint: 0, dive: 0, diveTarget: 0, flash: 0, flashTarget: 0 },
      fish: [], bubbles: [], rays: [], spots: [],
      atlas: null, bubbleSprite: null,
      curious: null, lookRect: null,
      surfaceY: 0,
      scene: SCENES[variant] || {},
      helpers: { rnd, lerp, clamp, TAU },
    };

    let raf = 0;
    let last = 0;
    let running = false;

    // ---------------------------------------------------------------- building
    function fishTotal() {
      return Math.round(cfg.fish * (W.small ? 0.6 : 1));
    }
    function newFish(i, first, label) {
      // a fish that carries a name is always one of the big, near ones
      const z = label ? rnd(0.85, 1) : rnd(0.25, 1);
      const top = W.surfaceY ? W.surfaceY + 0.07 * W.h : 0.2 * W.h;
      const dir = Math.random() < 0.5 ? -1 : 1;
      const size = lerp(cfg.fishSize[0], cfg.fishSize[1], z) * (W.small ? 0.85 : 1);
      const margin = FISH_W * size;
      return {
        i, z, dir, size,
        speed: lerp(cfg.fishSpeed[0], cfg.fishSpeed[1], Math.random()) * (0.55 + z * 0.55),
        baseY: rnd(top, 0.86 * W.h),
        amp: rnd(10, 44),
        freq: rnd(0.25, 0.7),
        ph: rnd(0, TAU),
        color: i % W.atlas.length,
        shape: Math.floor(rnd(0, 3)),
        x: first ? rnd(0, W.w) : dir > 0 ? -margin : W.w + margin,
        y: 0, vy: 0,
        tail: rnd(0, 1),
        tailSpeed: rnd(1.5, 2.6),
        pushX: 0, pushY: 0,
        label: label || null,
      };
    }
    function bubbleX() {
      if (cfg.bubbleArea === "sides") {
        const left = Math.random() < 0.5;
        return left ? rnd(0, W.w * 0.11) : rnd(W.w * 0.89, W.w);
      }
      return rnd(0, W.w);
    }
    function newBubble(first, at) {
      const [smin, smax] = cfg.bubbleSize;
      const r = lerp(smin, smax, Math.pow(Math.random(), 1.6)) * (W.small ? 0.85 : 1);
      return {
        x: at ? at.x + rnd(-at.spread, at.spread) : bubbleX(),
        y: at ? at.y + rnd(-6, 6) : first ? rnd(0, W.h) : W.h + r + rnd(0, 60),
        r,
        vy: rnd(cfg.bubbleSpeed[0], cfg.bubbleSpeed[1]) * (0.5 + r / (smax * 1.4)),
        wob: rnd(6, 20),
        ph: rnd(0, TAU),
        a: rnd(0.35, 0.85),
        once: Boolean(at), // burst bubbles are not recycled
      };
    }
    function build() {
      if (W.scene.setup) W.scene.setup(W);
      W.atlas = buildFishAtlas(cfg.fishColors);
      W.bubbleSprite = buildBubble();
      W.fish = Array.from({ length: fishTotal() }, (_, i) => newFish(i, true));
      const bubbleCount = Math.round(cfg.bubbles * (W.small ? 0.6 : 1));
      W.bubbles = Array.from({ length: bubbleCount }, () => newBubble(true));
      W.rays = Array.from({ length: cfg.rays.count }, (_, i) => ({
        x: (i + 0.5) / cfg.rays.count + rnd(-0.05, 0.05),
        w: cfg.rays.width * rnd(0.6, 1.3),
        ph: rnd(0, TAU),
        sp: rnd(0.05, 0.13),
        a: rnd(0.6, 1),
      }));
      if (W.scene.init) W.scene.init(W);
    }

    function resize() {
      W.dpr = Math.min(window.devicePixelRatio || 1, 2);
      W.w = window.innerWidth;
      W.h = window.innerHeight;
      canvas.width = Math.round(W.w * W.dpr);
      canvas.height = Math.round(W.h * W.dpr);
      canvas.style.width = `${W.w}px`;
      canvas.style.height = `${W.h}px`;
      ctx.setTransform(W.dpr, 0, 0, W.dpr, 0, 0);
      if (W.scene.setup) W.scene.setup(W);
      const minY = W.surfaceY ? W.surfaceY + 0.07 * W.h : 0.16 * W.h;
      if (W.fish.length) W.fish.forEach((f) => (f.baseY = clamp(f.baseY, minY, 0.88 * W.h)));
      if (W.scene.resize) W.scene.resize(W);
      if (!running) drawFrame();
    }

    // ---------------------------------------------------------------- drawing
    function drawBackground() {
      const g = ctx.createLinearGradient(0, 0, 0, W.h);
      if (W.light) {
        g.addColorStop(0, cfg.lightTop);
        g.addColorStop(1, cfg.lightBottom);
      } else {
        g.addColorStop(0, cfg.top);
        g.addColorStop(0.55, cfg.bottom);
        g.addColorStop(1, cfg.deep);
      }
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W.w, W.h);
    }

    // beams of light coming down from the surface
    function drawRays(t, strength = 1) {
      ctx.globalCompositeOperation = W.light ? "source-over" : "lighter";
      const skew = W.h * 0.32;
      W.rays.forEach((r) => {
        const sway = Math.sin(t * r.sp * TAU + r.ph);
        const x = (r.x + sway * 0.03 + (W.sx - 0.5) * 0.02) * W.w;
        const half = r.w * W.w * (0.5 + 0.08 * Math.sin(t * 0.3 + r.ph));
        const top = W.surfaceY || 0;
        const g = ctx.createLinearGradient(0, top, 0, W.h * 0.92);
        const a = cfg.rays.alpha * r.a * strength * (W.light ? 0.9 : 1);
        g.addColorStop(0, `rgba(190,240,255,${a})`);
        g.addColorStop(0.55, `rgba(140,215,250,${a * 0.35})`);
        g.addColorStop(1, "rgba(120,200,245,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(x - half * 0.5, top);
        ctx.lineTo(x + half * 0.5, top);
        ctx.lineTo(x + half * 1.6 - skew * 0.3 + sway * 30, W.h * 0.92);
        ctx.lineTo(x - half * 1.6 - skew * 0.3 + sway * 30, W.h * 0.92);
        ctx.closePath();
        ctx.fill();
      });
      ctx.globalCompositeOperation = "source-over";
    }

    function updateFish(dt) {
      const speedMul = 1 + W.fx.charge * 1.3 + W.fx.dive * 3.4;
      W.fish.forEach((f) => {
        if (W.curious === f && W.lookRect) {
          // a curious fish swims up to the card and looks at it, its tail slow
          const half = FISH_W * f.size * 0.5;
          const tx = W.lookSide === "right" ? W.lookRect.right + 14 + half : W.lookRect.left - 14 - half;
          const ty = W.lookRect.top + W.lookRect.height * 0.5;
          const k = 1 - Math.exp(-dt * 1.9);
          const nx = f.x + (tx - f.x) * k;
          const ny = f.y + (ty - f.y) * k;
          f.vy = (ny - f.y) / Math.max(dt, 0.001);
          f.x = nx;
          f.y = ny;
          f.dir = W.lookSide === "right" ? -1 : 1; // faces the card
          f.tail += dt * 0.9;
          return;
        }
        f.x += f.dir * f.speed * speedMul * dt + f.pushX * dt;
        f.pushX *= Math.exp(-dt * 1.6);
        f.pushY *= Math.exp(-dt * 1.6);
        // while the form is waiting, the school drifts toward the middle of the tank
        const centreY = lerp(f.baseY, W.h * 0.5, W.fx.charge * 0.55);
        const ny = centreY + Math.sin(W.t * f.freq + f.ph) * f.amp + f.pushY;
        f.vy = f.y ? (ny - f.y) / Math.max(dt, 0.001) : 0;
        f.y = f.y ? lerp(f.y, ny, 1 - Math.exp(-dt * 6)) : ny;
        f.tail += dt * f.tailSpeed * (1 + W.fx.charge * 0.8 + W.fx.dive);
        const margin = FISH_W * f.size * 1.2;
        if ((f.dir > 0 && f.x > W.w + margin) || (f.dir < 0 && f.x < -margin)) {
          Object.assign(f, newFish(f.i, false, f.label));
        }
      });
    }

    function drawFishAll() {
      // far to near, so the near ones cover the far ones
      const order = [...W.fish].sort((a, b) => a.z - b.z);
      order.forEach((f) => {
        const off = (W.sx - 0.5) * cfg.parallax * (f.z * 2 - 1);
        const alpha = clamp(0.32 + f.z * 0.68, 0, 1) * (1 - W.fx.dive * 0.25);
        ctx.globalAlpha = alpha;
        drawFish(ctx, W.atlas[f.color][f.shape], f.x + off, f.y, f.dir, f.size, f.tail, clamp(f.vy * 0.004, -0.4, 0.4));
        if (W.scene.fishExtra) W.scene.fishExtra(W, f, off, alpha);
      });
      ctx.globalAlpha = 1;
    }

    function updateBubbles(dt) {
      const speedMul = 1 + W.fx.dive * 5 + W.fx.charge * 0.6;
      for (let i = 0; i < W.bubbles.length; i++) {
        const b = W.bubbles[i];
        b.y -= b.vy * speedMul * dt;
        b.ph += dt * 1.6;
        const top = W.surfaceY ? W.surfaceY + b.r : -b.r * 2;
        if (b.y < top) {
          if (b.once) {
            W.bubbles.splice(i, 1);
            i--;
          } else {
            Object.assign(b, newBubble(false));
          }
        }
      }
    }
    function drawBubbles() {
      W.bubbles.forEach((b) => {
        const off = (W.sx - 0.5) * cfg.parallax * (b.r / 12);
        const x = b.x + Math.sin(b.ph) * b.wob + off;
        ctx.globalAlpha = b.a;
        ctx.drawImage(W.bubbleSprite, x - b.r, b.y - b.r, b.r * 2, b.r * 2);
      });
      ctx.globalAlpha = 1;
    }

    function drawSpots() {
      for (let i = W.spots.length - 1; i >= 0; i--) {
        const s = W.spots[i];
        s.age += W.dt;
        const k = s.age / s.life;
        if (k >= 1) {
          W.spots.splice(i, 1);
          continue;
        }
        const a = Math.sin(Math.min(1, k * 1.15) * Math.PI) * 0.34;
        const cx = s.rect.left + s.rect.width / 2;
        const cy = s.rect.top + s.rect.height / 2;
        ctx.globalCompositeOperation = W.light ? "source-over" : "lighter";
        const g = ctx.createLinearGradient(0, 0, 0, cy + s.rect.height * 0.4);
        g.addColorStop(0, `rgba(190,250,255,${a * 0.2})`);
        g.addColorStop(1, `rgba(160,240,255,${a})`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(cx - 24, 0);
        ctx.lineTo(cx + 24, 0);
        ctx.lineTo(cx + s.rect.width * 0.62, cy + s.rect.height * 0.4);
        ctx.lineTo(cx - s.rect.width * 0.62, cy + s.rect.height * 0.4);
        ctx.closePath();
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";
      }
    }

    function drawFrame() {
      W.light = document.documentElement.dataset.theme === "light";
      drawBackground();
      if (reduced) {
        // still water: a soft glow of light and nothing that moves
        drawRays(0, 0.8);
        return;
      }
      drawRays(W.t);
      if (W.scene.back) W.scene.back(W);
      drawFishAll();
      drawBubbles();
      if (W.scene.front) W.scene.front(W);
      drawSpots();
      if (W.fx.flash > 0.01) {
        ctx.fillStyle = `rgba(190,245,255,${(W.fx.flash * 0.8).toFixed(3)})`;
        ctx.fillRect(0, 0, W.w, W.h);
      }
      if (W.fx.tint > 0.02) {
        ctx.fillStyle = `rgba(255,70,90,${(W.fx.tint * 0.14).toFixed(3)})`;
        ctx.fillRect(0, 0, W.w, W.h);
      }
    }

    function step(now) {
      const dt = Math.min(0.05, (now - (last || now)) / 1000);
      last = now;
      W.dt = dt;
      W.t += dt;
      const ease = (k) => 1 - Math.exp(-dt * k);
      W.sx += (W.mx - W.sx) * ease(2.2);
      W.sy += (W.my - W.sy) * ease(2.2);
      W.fx.charge += (W.fx.chargeTarget - W.fx.charge) * ease(3);
      W.fx.dive += (W.fx.diveTarget - W.fx.dive) * ease(2.4);
      W.fx.flash += (W.fx.flashTarget - W.fx.flash) * ease(7);
      W.fx.tint *= Math.exp(-dt * 2.2);
      updateFish(dt);
      updateBubbles(dt);
      if (W.scene.update) W.scene.update(W, dt);
      drawFrame();
      raf = requestAnimationFrame(step);
    }

    // ---------------------------------------------------------------- control
    function start() {
      if (running || reduced || document.hidden) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(step);
    }
    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }
    function applyMode() {
      reduced = mqReduce.matches;
      if (reduced) {
        stop();
        drawFrame();
      } else {
        start();
      }
    }
    function onVisibility() {
      if (document.hidden) stop();
      else applyMode();
    }
    function onSmall() {
      W.small = mqSmall.matches;
      build();
      if (!running) drawFrame();
    }

    function onPointer(e) {
      W.mx = e.clientX / Math.max(1, W.w);
      W.my = e.clientY / Math.max(1, W.h);
      W.px = e.clientX;
      W.py = e.clientY;
    }
    function onLeave() {
      W.px = W.py = -9999;
    }

    function onAuthFx(e) {
      const type = e.detail && e.detail.type;
      if (type === "charge") W.fx.chargeTarget = 1;
      else if (type === "idle") W.fx.chargeTarget = 0;
      else if (type === "error") {
        W.fx.chargeTarget = 0;
        W.fx.tint = 1;
        // the school bolts away from the middle
        W.fish.forEach((f) => {
          const away = f.x < W.w / 2 ? -1 : 1;
          f.pushX = away * rnd(240, 520);
          f.pushY = rnd(-160, 160);
        });
        burst(W.w / 2, W.h * 0.75, 26, true);
      } else if (type === "success") {
        W.fx.chargeTarget = 0;
        W.fx.diveTarget = 1;
        setTimeout(() => {
          W.fx.flashTarget = 1;
        }, 420);
        burst(W.w / 2, W.h * 0.8, 40, true);
        if (!running) drawFrame();
      }
    }
    function burst(x, y, count, big) {
      const room = Math.max(0, (cfg.bubbles + 60) - W.bubbles.length);
      for (let i = 0; i < Math.min(count, room); i++) {
        const b = newBubble(false, { x, y, spread: big ? 90 : 26 });
        if (big) b.r *= rnd(0.8, 1.6);
        b.vy *= rnd(0.9, 1.7);
        W.bubbles.push(b);
      }
    }
    function onBubbles(e) {
      const d = e.detail || {};
      burst(d.x ?? W.w / 2, d.y ?? W.h, d.count || 10, Boolean(d.big));
    }
    function onLook(e) {
      const rect = e.detail && e.detail.rect;
      if (!rect) {
        // let the fish go: it carries on from where it is
        if (W.curious) W.curious.baseY = W.curious.y;
        W.curious = null;
        W.lookRect = null;
        return;
      }
      W.lookRect = rect;
      // the fish waits in the margin on the outer side of the card, where nothing covers it
      W.lookSide = W.w - rect.right < rect.left ? "right" : "left";
      if (W.curious || !W.fish.length) return;
      let best = null;
      let bestD = Infinity;
      W.fish.forEach((f) => {
        const d = Math.hypot(f.x - rect.left, f.y - rect.top);
        if (d < bestD) {
          bestD = d;
          best = f;
        }
      });
      W.curious = best;
    }
    function onSpot(e) {
      const rect = e.detail && e.detail.rect;
      if (rect) W.spots.push({ rect, age: 0, life: 1.9 });
      if (!running) drawFrame();
    }

    W.burst = burst;
    W.light = document.documentElement.dataset.theme === "light";
    resize();
    build();
    drawFrame();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("auth-fx", onAuthFx);
    window.addEventListener("aquarium-bubbles", onBubbles);
    window.addEventListener("aquarium-look", onLook);
    window.addEventListener("aquarium-spot", onSpot);
    document.addEventListener("visibilitychange", onVisibility);
    mqReduce.addEventListener("change", applyMode);
    mqSmall.addEventListener("change", onSmall);
    applyMode();

    return () => {
      stop();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("auth-fx", onAuthFx);
      window.removeEventListener("aquarium-bubbles", onBubbles);
      window.removeEventListener("aquarium-look", onLook);
      window.removeEventListener("aquarium-spot", onSpot);
      document.removeEventListener("visibilitychange", onVisibility);
      mqReduce.removeEventListener("change", applyMode);
      mqSmall.removeEventListener("change", onSmall);
    };
  }, [variant]);

  return <canvas ref={canvasRef} className="aquarium-canvas" aria-hidden="true" />;
}
