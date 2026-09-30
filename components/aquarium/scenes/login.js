import { drawWhale, drawDolphin, drawKelp } from "../creatures";

// "Gates of the deep sea": a night sky over the water, a dolphin that leaps out every 8 seconds,
// a huge whale drifting far behind (half of it below the bottom edge), kelp and rocks on the sea
// floor, and the words JavaScript / React / API floating next to the three biggest fish.

const NAMES = ["JavaScript", "React", "API"];
const JUMP_EVERY = 8; // seconds
const JUMP_TIME = 2.7;

const rnd = (a, b) => a + Math.random() * (b - a);

function waveY(W, x, t) {
  return W.surfaceY + Math.sin(x * 0.011 + t * 1.1) * 3.4 + Math.sin(x * 0.0047 - t * 0.7) * 5;
}

function buildFloor(W) {
  const s = W.s;
  s.kelp = Array.from({ length: W.small ? 6 : 11 }, () => ({
    x: rnd(0.02, 0.98),
    h: rnd(0.13, 0.3),
    seed: rnd(0, 6),
    w: rnd(5, 9),
  }));
  s.rocks = Array.from({ length: 7 }, (_, i) => ({ x: (i + rnd(0.1, 0.9)) / 7, r: rnd(0.03, 0.07) }));
}

function splash(W, x) {
  const s = W.s;
  for (let i = 0; i < 18; i++) {
    s.drops.push({ x: x + rnd(-14, 14), y: W.surfaceY, vx: rnd(-170, 170), vy: rnd(-460, -170), age: 0, life: rnd(0.7, 1.1) });
  }
  s.ripples.push({ x, age: 0, life: 1.6 });
  if (W.burst) W.burst(x, W.surfaceY + 40, 9, true);
}

export const loginScene = {
  setup(W) {
    W.surfaceY = W.h * 0.22;
  },

  init(W) {
    W.s = {
      stars: Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random() * 0.95, r: rnd(0.4, 1.5), ph: rnd(0, 6.28) })),
      whaleX: null,
      drops: [],
      ripples: [],
      dolphin: { active: false, u: 0, x0: 0, dir: 1, cool: 2.4, flip: false, side: 1 },
    };
    buildFloor(W);
    const big = [...W.fish].sort((a, b) => b.size - a.size).slice(0, 3);
    big.forEach((f, i) => {
      f.label = NAMES[i];
      f.z = Math.max(f.z, 0.86);
    });
  },

  update(W, dt) {
    const s = W.s;
    if (!s) return;
    const d = s.dolphin;
    d.cool -= dt;
    if (!d.active && d.cool <= 0) {
      d.active = true;
      d.u = 0;
      d.dir = d.flip ? -1 : 1;
      d.flip = !d.flip;
      d.x0 = d.dir > 0 ? W.w * 0.05 : W.w * 0.95;
      d.side = 1;
    }
    if (d.active) {
      d.u += dt / JUMP_TIME;
      const u = d.u;
      const yb = W.surfaceY + W.h * 0.07;
      const A = yb - (W.surfaceY - W.h * 0.155);
      d.x = d.x0 + d.dir * W.w * 0.3 * u;
      d.y = yb - 4 * A * u * (1 - u);
      d.vx = d.dir * W.w * 0.3;
      d.vy = -4 * A * (1 - 2 * u);
      const side = d.y < W.surfaceY ? -1 : 1;
      if (side !== d.side) splash(W, d.x); // out of the water, and back in
      d.side = side;
      if (u >= 1) {
        d.active = false;
        d.cool = JUMP_EVERY;
      }
    }
    for (let i = s.drops.length - 1; i >= 0; i--) {
      const p = s.drops[i];
      p.age += dt;
      p.vy += 1050 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.age > p.life) s.drops.splice(i, 1);
    }
    for (let i = s.ripples.length - 1; i >= 0; i--) {
      s.ripples[i].age += dt;
      if (s.ripples[i].age > s.ripples[i].life) s.ripples.splice(i, 1);
    }
    // the whale takes about two minutes to cross the whole screen
    const L = Math.min(W.w * 0.92, 1250);
    if (s.whaleX === null) s.whaleX = W.w * 0.62;
    s.whaleX -= ((W.w + L) / 130) * dt * (1 + W.fx.dive * 6);
    if (s.whaleX < -L * 0.6) s.whaleX = W.w + L * 0.6;
  },

  back(W) {
    const { ctx } = W;
    const s = W.s;
    if (!s) return;
    const t = W.t;
    const sy = W.surfaceY;

    // bright water just under the surface
    const band = ctx.createLinearGradient(0, sy, 0, sy + W.h * 0.14);
    band.addColorStop(0, W.light ? "rgba(255,255,255,0.4)" : "rgba(130,235,240,0.3)");
    band.addColorStop(1, "rgba(130,235,240,0)");
    ctx.fillStyle = band;
    ctx.fillRect(0, sy, W.w, W.h * 0.14);

    // the sky above the waves: night, stars and a moon
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(W.w, 0);
    for (let x = W.w; x >= 0; x -= 14) ctx.lineTo(x, waveY(W, x, t));
    ctx.closePath();
    ctx.clip();
    const sky = ctx.createLinearGradient(0, 0, 0, sy + 10);
    if (W.light) {
      sky.addColorStop(0, "#7fc8ee");
      sky.addColorStop(1, "#d6f1fb");
    } else {
      sky.addColorStop(0, "#010613");
      sky.addColorStop(0.7, "#04203a");
      sky.addColorStop(1, "#0c4a66");
    }
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W.w, sy + 30);
    if (!W.light) {
      s.stars.forEach((st) => {
        ctx.globalAlpha = 0.35 + 0.5 * Math.abs(Math.sin(t * 0.8 + st.ph));
        ctx.fillStyle = "#dff6ff";
        ctx.beginPath();
        ctx.arc(st.x * W.w, st.y * sy, st.r, 0, 6.283);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      const mx = W.w * 0.84;
      const my = sy * 0.34;
      const glow = ctx.createRadialGradient(mx, my, 4, mx, my, 90);
      glow.addColorStop(0, "rgba(210,240,255,0.5)");
      glow.addColorStop(1, "rgba(210,240,255,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(mx - 90, my - 90, 180, 180);
      ctx.fillStyle = "#e6f6ff";
      ctx.beginPath();
      ctx.arc(mx, my, 15, 0, 6.283);
      ctx.fill();
      ctx.fillStyle = "#04203a";
      ctx.beginPath();
      ctx.arc(mx + 7, my - 3, 13, 0, 6.283);
      ctx.fill();
    }
    ctx.restore();

    // the waterline itself
    ctx.strokeStyle = W.light ? "rgba(255,255,255,0.85)" : "rgba(170,240,250,0.6)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let x = 0; x <= W.w; x += 10) {
      const y = waveY(W, x, t);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // the whale, far behind: only about half of it is on screen
    const L = Math.min(W.w * 0.92, 1250);
    const wy = W.h * 0.9 + Math.sin(t * 0.22) * 9;
    ctx.save();
    ctx.globalAlpha = W.light ? 0.2 : 0.32;
    ctx.translate(s.whaleX - (W.sx - 0.5) * 16, wy);
    ctx.scale(-1, 1);
    drawWhale(ctx, L, Math.sin(t * 0.55) * 0.7, W.light ? "#3f8fb0" : "#1f6d88", W.light ? "#7cc0d8" : "#3f95a8");
    ctx.restore();

    // sea floor: rocks and kelp
    const fy = W.h;
    ctx.fillStyle = W.light ? "rgba(20,90,110,0.55)" : "rgba(0,14,24,0.96)";
    ctx.beginPath();
    ctx.moveTo(0, fy);
    ctx.lineTo(0, fy - W.h * 0.035);
    s.rocks.forEach((r) => {
      ctx.quadraticCurveTo(r.x * W.w, fy - W.h * (0.035 + r.r), (r.x + 0.07) * W.w, fy - W.h * 0.03);
    });
    ctx.lineTo(W.w, fy - W.h * 0.03);
    ctx.lineTo(W.w, fy);
    ctx.closePath();
    ctx.fill();
    s.kelp.forEach((k) => {
      drawKelp(ctx, k.x * W.w + (W.sx - 0.5) * 12, fy - W.h * 0.02, k.h * W.h, t, k.seed, W.light ? "rgba(20,120,110,0.6)" : "rgba(3,60,58,0.85)", k.w);
    });
  },

  front(W) {
    const { ctx } = W;
    const s = W.s;
    if (!s) return;
    const d = s.dolphin;

    s.ripples.forEach((r) => {
      const k = r.age / r.life;
      ctx.strokeStyle = `rgba(200,245,255,${(1 - k) * 0.6})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(r.x, W.surfaceY, 12 + k * 150, 2 + k * 15, 0, 0, 6.283);
      ctx.stroke();
    });

    if (d.active) {
      const L = Math.min(Math.max(W.w * 0.13, 120), 200);
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(Math.atan2(d.vy, d.vx));
      if (d.vx < 0) ctx.scale(1, -1); // keep the belly down when swimming left
      drawDolphin(ctx, L, Math.sin(W.t * 9) * 0.8);
      ctx.restore();
    }

    s.drops.forEach((p) => {
      ctx.globalAlpha = Math.max(0, 1 - p.age / p.life) * 0.85;
      ctx.fillStyle = "#dff8ff";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.2, 0, 6.283);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  },

  // the names that float beside the biggest fish
  fishExtra(W, f, off, alpha) {
    if (!f.label) return;
    const { ctx } = W;
    ctx.save();
    ctx.globalAlpha = alpha * 0.7;
    ctx.font = `600 ${Math.round(12 + f.size * 3)}px system-ui, "Segoe UI", Arial`;
    ctx.textAlign = "center";
    ctx.fillStyle = W.light ? "#0b4a66" : "#d4f6ff";
    ctx.fillText(f.label, f.x + off, f.y - 34 * f.size - 6 + Math.sin(W.t * 1.4 + f.ph) * 3);
    ctx.restore();
  },
};
