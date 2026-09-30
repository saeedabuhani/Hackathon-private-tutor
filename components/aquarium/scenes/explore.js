import { drawShark } from "../creatures";

// "Open sea adventure": moving waves along the top under a dusk sky, a small shark that crosses
// far away now and then, and an octopus in the bottom-left corner that stretches its arms toward
// the mouse when it comes near.

const TAU = Math.PI * 2;
const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const wrapPi = (a) => Math.atan2(Math.sin(a), Math.cos(a));

const WAVES = [
  { amp: 6, len: 0.011, speed: 0.9, alpha: 0.42, w: 2 },
  { amp: 9, len: 0.0065, speed: -0.6, alpha: 0.26, w: 1.6 },
  { amp: 4, len: 0.02, speed: 1.4, alpha: 0.3, w: 1.2 },
];
const SEGS = 7;
const ARMS = 8;

function waveAt(W, layer, x) {
  return W.surfaceY + layer.amp * Math.sin(x * layer.len + W.t * layer.speed) + Math.sin(x * 0.004 + W.t * 0.3) * 3;
}

function buildOctopus(W) {
  const R = Math.max(34, W.h * 0.055);
  W.s.oct = {
    R,
    // in the free corner: beside the video list, which is on the right (left when the page is RTL)
    x: document.documentElement.dir === "rtl" ? R * 2.4 : W.w - R * 2.4,
    y: W.h - R * 1.3,
    arms: Array.from({ length: ARMS }, (_, i) => ({
      i,
      side: i < ARMS / 2 ? -1 : 1,
      ph: rnd(0, TAU),
      reach: 0,
      ang: Array(SEGS).fill(0),
    })),
  };
}

function drawOctopus(W) {
  const { ctx } = W;
  const o = W.s.oct;
  const R = o.R;
  const d = Math.hypot(W.px - o.x, W.py - (o.y - R * 0.3));
  // 0 far away .. 1 right next to it
  const near = W.px < -1000 ? 0 : clamp(1 - (d - R * 1.6) / (W.w * 0.24), 0, 1);
  const e = near * near * (3 - 2 * near);

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  o.arms.forEach((arm) => {
    const bx = o.x + (arm.i - (ARMS - 1) / 2) * R * 0.3;
    const by = o.y + R * 0.4;
    // resting pose: arms fanned out along the floor, the tips curling up, slowly stirring
    const left = arm.side < 0;
    const spread = (left ? 3 - arm.i : arm.i - 4) * 0.14;
    const restBase = left ? Math.PI - 0.12 - spread : 0.12 + spread;
    const target = Math.atan2(W.py - by, W.px - bx);
    arm.reach += (e - arm.reach) * 0.07;
    let x = bx;
    let y = by;
    const len = R * 0.6 * (1 + arm.reach * 0.6);
    const pts = [[x, y]];
    for (let k = 0; k < SEGS; k++) {
      const kk = (k + 1) / SEGS;
      const curl = Math.pow(kk, 1.7) * 1.55 * (left ? 1 : -1);
      const rest = restBase + curl + Math.sin(W.t * 0.9 + arm.ph + k * 0.6) * 0.12 * (0.3 + kk);
      const toward = target + Math.sin(W.t * 2.1 + arm.ph + k * 0.9) * 0.09;
      const mix = clamp(arm.reach * (0.3 + 0.7 * kk), 0, 1);
      const a = rest + wrapPi(toward - rest) * mix;
      arm.ang[k] = a;
      x += Math.cos(a) * len;
      y += Math.sin(a) * len;
      pts.push([x, y]);
    }
    // a smooth tapered arm: many short round-capped strokes that get thinner toward the tip
    // (a dark body first, then a lighter core on top)
    const steps = SEGS * 7;
    for (let pass = 0; pass < 2; pass++) {
      ctx.strokeStyle = pass === 0 ? "#6a2f8e" : "#b872bc";
      let lx = pts[0][0];
      let ly = pts[0][1];
      for (let n = 1; n <= steps; n++) {
        const f = n / steps;
        const idx = Math.min(SEGS - 1, Math.floor(f * SEGS));
        const local = f * SEGS - idx;
        const px = pts[idx][0] + (pts[idx + 1][0] - pts[idx][0]) * local;
        const py = pts[idx][1] + (pts[idx + 1][1] - pts[idx][1]) * local;
        ctx.lineWidth = Math.max(2, 2 * R * (pass === 0 ? 0.17 : 0.09) * Math.pow(1 - f, 0.8) + 1.5);
        ctx.beginPath();
        ctx.moveTo(lx - pass * 0.8, ly - pass * 1.2);
        ctx.lineTo(px - pass * 0.8, py - pass * 1.2);
        ctx.stroke();
        lx = px;
        ly = py;
      }
    }
  });

  // head, eyes
  const g = ctx.createRadialGradient(o.x - R * 0.3, o.y - R * 0.6, 2, o.x, o.y, R * 1.3);
  g.addColorStop(0, "#d886c8");
  g.addColorStop(0.55, "#9a45b0");
  g.addColorStop(1, "#5a2a86");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(o.x, o.y - R * 0.1, R * 0.95, R * 1.1, 0, 0, TAU);
  ctx.fill();
  const look = clamp((W.px - o.x) / (W.w * 0.5), -1, 1) * R * 0.06;
  [-1, 1].forEach((s) => {
    ctx.fillStyle = "#fff6ea";
    ctx.beginPath();
    ctx.ellipse(o.x + s * R * 0.36, o.y + R * 0.02, R * 0.2, R * 0.24, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#1a0a26";
    ctx.beginPath();
    ctx.arc(o.x + s * R * 0.36 + look, o.y + R * 0.05, R * 0.1, 0, TAU);
    ctx.fill();
  });
}

export const exploreScene = {
  setup(W) {
    W.surfaceY = W.h * 0.085;
  },

  init(W) {
    W.s = { shark: { active: false, x: 0, y: 0, dir: 1, cool: 7, L: 0 } };
    buildOctopus(W);
  },
  resize(W) {
    if (W.s) buildOctopus(W);
  },

  update(W, dt) {
    const s = W.s;
    if (!s) return;
    const k = s.shark;
    k.cool -= dt;
    if (!k.active && k.cool <= 0) {
      k.active = true;
      k.dir = Math.random() < 0.5 ? 1 : -1;
      k.L = clamp(W.w * 0.15, 130, 240);
      k.x = k.dir > 0 ? -k.L : W.w + k.L;
      k.y = rnd(0.36, 0.6) * W.h;
    }
    if (k.active) {
      k.x += k.dir * ((W.w + k.L * 2) / 22) * dt;
      if ((k.dir > 0 && k.x > W.w + k.L) || (k.dir < 0 && k.x < -k.L)) {
        k.active = false;
        k.cool = rnd(24, 36);
      }
    }
  },

  back(W) {
    const { ctx } = W;
    const s = W.s;
    if (!s) return;
    const t = W.t;
    const sy = W.surfaceY;

    // dusk above the waves
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(W.w, 0);
    for (let x = W.w; x >= 0; x -= 14) ctx.lineTo(x, waveAt(W, WAVES[0], x));
    ctx.closePath();
    ctx.clip();
    const sky = ctx.createLinearGradient(0, 0, 0, sy + 14);
    if (W.light) {
      sky.addColorStop(0, "#9bb0f0");
      sky.addColorStop(1, "#e2e8ff");
    } else {
      sky.addColorStop(0, "#0a1040");
      sky.addColorStop(1, "#5a4a9c");
    }
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W.w, sy + 30);
    ctx.restore();

    // three layers of moving waves, the front ones brighter
    WAVES.forEach((L) => {
      ctx.strokeStyle = `rgba(${W.light ? "255,255,255" : "170,195,255"},${L.alpha})`;
      ctx.lineWidth = L.w;
      ctx.beginPath();
      for (let x = 0; x <= W.w; x += 10) {
        const y = waveAt(W, L, x);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });
    // light just under the surface
    const band = ctx.createLinearGradient(0, sy, 0, sy + W.h * 0.12);
    band.addColorStop(0, W.light ? "rgba(255,255,255,0.4)" : "rgba(150,175,255,0.24)");
    band.addColorStop(1, "rgba(150,175,255,0)");
    ctx.fillStyle = band;
    ctx.fillRect(0, sy + 4, W.w, W.h * 0.12);

    // the shark, far away and dim
    const k = s.shark;
    if (k.active) {
      ctx.save();
      ctx.globalAlpha = W.light ? 0.2 : 0.3;
      ctx.translate(k.x - (W.sx - 0.5) * 12, k.y + Math.sin(t * 0.5) * 8);
      if (k.dir < 0) ctx.scale(-1, 1);
      drawShark(ctx, k.L, Math.sin(t * 1.6) * 0.7, W.light ? "#4a62b0" : "#2c3d84", W.light ? "#8fa3d8" : "#5468b0");
      ctx.restore();
    }
  },

  front(W) {
    if (W.s) drawOctopus(W);
  },
};
