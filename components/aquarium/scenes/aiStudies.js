import { drawSquid } from "../creatures";

// "Deep-sea research station": a big bioluminescent squid that slowly changes colour and drifts
// up and down at the side, glowing plankton that wander in the dark, deep-sea fish that carry
// their own lights, and a beam of light that lands on a video card when you open it (event
// "aquarium-spot", sent by the page) as if it were a new find.

const TAU = Math.PI * 2;
const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function plankton(W) {
  const n = W.small ? 38 : 80;
  W.s.dots = Array.from({ length: n }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: rnd(0.8, 2.6),
    ph: rnd(0, TAU),
    sp: rnd(0.15, 0.6),
    drift: rnd(6, 20),
    hue: rnd(150, 200),
  }));
}

export const aiScene = {
  init(W) {
    W.s = { squid: { x: 0, y: 0, hue: 178, phase: rnd(0, 6) } };
    plankton(W);
  },
  resize(W) {
    if (W.s) plankton(W);
  },
  update(W, dt) {
    const s = W.s;
    if (!s) return;
    const q = s.squid;
    q.phase += dt;
    // the colour walks slowly through cyan, blue, violet and back (about 50 seconds a round)
    q.hue = 200 + Math.sin(W.t * 0.125) * 70;
  },

  back(W) {
    const { ctx } = W;
    const s = W.s;
    if (!s) return;
    const t = W.t;
    ctx.globalCompositeOperation = W.light ? "source-over" : "lighter";
    s.dots.forEach((d) => {
      const x = ((d.x * W.w + Math.sin(t * d.sp + d.ph) * d.drift + (W.sx - 0.5) * 18) % W.w + W.w) % W.w;
      const y = (((d.y * W.h - t * d.sp * 6) % W.h) + W.h) % W.h;
      const a = (0.25 + 0.75 * Math.abs(Math.sin(t * d.sp * 1.6 + d.ph))) * (W.light ? 0.5 : 0.85);
      const rad = d.r * 5;
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, `hsla(${d.hue}, 100%, 72%, ${a})`);
      g.addColorStop(1, `hsla(${d.hue}, 100%, 60%, 0)`);
      ctx.fillStyle = g;
      ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    });
    ctx.globalCompositeOperation = "source-over";

    // the squid, in the open water beside the list (the video is opaque, so it stays clear of it)
    const q = s.squid;
    const S = clamp(W.h * 0.42, 220, 420);
    const rtl = document.documentElement.dir === "rtl";
    const edge = W.w > 1000 ? 78 : 30;
    const x = (rtl ? edge : W.w - edge) + Math.sin(t * 0.16) * 12 - (W.sx - 0.5) * 22;
    const y = W.h * 0.5 + Math.sin(t * 0.21 + q.phase) * W.h * 0.11;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(t * 0.21 + q.phase) * 0.06);
    ctx.globalAlpha = W.w > 1000 ? 0.78 : 0.5;
    drawSquid(ctx, S, t, q.hue, W.light ? 0.5 : 1);
    ctx.restore();
    ctx.globalAlpha = 1;
  },

  // deep-sea fish carry a lamp: a small glowing point on a stalk in front of the head
  fishExtra(W, f, off, alpha) {
    if (f.z < 0.55) return;
    const { ctx } = W;
    const front = f.x + off + f.dir * 36 * f.size;
    const y = f.y - 22 * f.size;
    const hue = 165 + ((f.i * 37) % 60);
    ctx.save();
    ctx.globalCompositeOperation = W.light ? "source-over" : "lighter";
    ctx.strokeStyle = `hsla(${hue}, 60%, 70%, ${alpha * 0.6})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(f.x + off + f.dir * 18 * f.size, f.y - 12 * f.size);
    ctx.quadraticCurveTo(f.x + off + f.dir * 26 * f.size, y - 14, front, y);
    ctx.stroke();
    const pulse = 0.6 + 0.4 * Math.sin(W.t * 2.4 + f.ph);
    const R = 20 * f.size;
    const g = ctx.createRadialGradient(front, y, 0, front, y, R);
    g.addColorStop(0, `hsla(${hue}, 100%, 82%, ${alpha * pulse})`);
    g.addColorStop(0.3, `hsla(${hue}, 100%, 65%, ${alpha * pulse * 0.4})`);
    g.addColorStop(1, `hsla(${hue}, 100%, 60%, 0)`);
    ctx.fillStyle = g;
    ctx.fillRect(front - R, y - R, R * 2, R * 2);
    ctx.restore();
  },
};
