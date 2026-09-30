// "Coral reef": corals of five kinds along the bottom, swaying in a slow current. The back row is
// drawn behind the fish (dimmer), the front row in front of them, so the school swims between the
// corals. Bubbles are the variant's; the curious-fish behaviour is in the engine.

const TAU = Math.PI * 2;
const rnd = (a, b) => a + Math.random() * (b - a);
const PALETTE = [
  ["#ff6b9a", "#ffb0c9"],
  ["#ff9a4a", "#ffc994"],
  ["#b07cff", "#d9c2ff"],
  ["#3fd6c0", "#9af2e4"],
  ["#ffd35a", "#fff1ad"],
];
const KINDS = ["branch", "fan", "brain", "anemone", "tube", "branch", "fan"];

function layout(W) {
  const n = W.small ? 6 : 11;
  W.s.corals = Array.from({ length: n }, (_, i) => {
    const x = (i + 0.5) / n + rnd(-0.025, 0.025);
    // the middle of the screen is where the page's title and buttons sit: keep it calm and low
    const middle = Math.abs(x - 0.5) < 0.2;
    return {
      x,
      kind: middle ? (i % 2 ? "brain" : "anemone") : KINDS[i % KINDS.length],
      h: middle ? rnd(0.05, 0.075) : rnd(0.09, 0.17),
      color: PALETTE[Math.floor(rnd(0, PALETTE.length))],
      seed: rnd(0, 6),
      front: !middle && i % 2 === 1,
      dim: middle,
    };
  });
}

// the current: a slow push that changes along the reef
function current(W, x, seed) {
  return Math.sin(W.t * 0.55 + x * 0.004) * 0.6 + Math.sin(W.t * 0.23 + seed) * 0.3;
}

function branch(W, x, y, ang, len, depth, seed, color, w) {
  const { ctx } = W;
  const a = ang + Math.sin(W.t * 0.9 + seed + depth * 1.3) * 0.05 + current(W, x, seed) * 0.035 * (5 - depth);
  const nx = x + Math.cos(a) * len;
  const ny = y + Math.sin(a) * len;
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(nx, ny);
  ctx.stroke();
  if (depth > 0) {
    branch(W, nx, ny, a - 0.5, len * 0.72, depth - 1, seed, color, w * 0.72);
    branch(W, nx, ny, a + 0.42, len * 0.7, depth - 1, seed + 1, color, w * 0.72);
  } else {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(nx, ny, w * 0.7, 0, TAU);
    ctx.fill();
  }
}

function fan(W, x, y, h, seed, c) {
  const { ctx } = W;
  const sway = current(W, x, seed);
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = c[0];
  const rays = 17;
  for (let i = 0; i < rays; i++) {
    const k = i / (rays - 1) - 0.5;
    const tx = x + k * h * 1.5 + sway * h * 0.14;
    const ty = y - h * (1 - Math.abs(k) * 0.55);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + k * h * 0.5 + sway * h * 0.06, y - h * 0.55, tx, ty);
    ctx.stroke();
  }
  // the cross-threads that make it a net
  const keep = ctx.globalAlpha;
  ctx.strokeStyle = c[1];
  ctx.globalAlpha = keep * 0.55;
  ctx.lineWidth = 1;
  for (let r = 0.35; r < 1; r += 0.22) {
    ctx.beginPath();
    for (let i = 0; i < rays; i++) {
      const k = i / (rays - 1) - 0.5;
      const px = x + k * h * 1.5 * r + sway * h * 0.14 * r;
      const py = y - h * r * (1 - Math.abs(k) * 0.55);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = keep;
  ctx.strokeStyle = c[0];
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + sway * 2, y - h * 0.25);
  ctx.stroke();
}

function brain(W, x, y, h, seed, c) {
  const { ctx } = W;
  const rx = h * 0.85;
  const ry = h * 0.55;
  const g = ctx.createRadialGradient(x - rx * 0.3, y - ry * 0.6, 2, x, y, rx);
  g.addColorStop(0, c[1]);
  g.addColorStop(1, c[0]);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, Math.PI, TAU);
  ctx.closePath();
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = "rgba(20,10,40,0.28)";
  ctx.lineWidth = 2;
  for (let r = 1; r <= 5; r++) {
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) {
      const px = x - rx + (i / 24) * rx * 2;
      const py = y - ry * (r / 5.5) + Math.sin(i * 1.3 + r + seed) * 3;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function anemone(W, x, y, h, seed, c) {
  const { ctx } = W;
  const sway = current(W, x, seed);
  ctx.lineWidth = 3;
  for (let i = 0; i < 15; i++) {
    const k = i / 14 - 0.5;
    const wob = Math.sin(W.t * 1.1 + i * 0.8 + seed) * h * 0.09 + sway * h * 0.12;
    const tx = x + k * h * 1.3 + wob;
    const ty = y - h * (0.8 - Math.abs(k) * 0.4);
    ctx.strokeStyle = c[0];
    ctx.beginPath();
    ctx.moveTo(x + k * h * 0.25, y);
    ctx.quadraticCurveTo(x + k * h * 0.8 + wob * 0.5, y - h * 0.45, tx, ty);
    ctx.stroke();
    ctx.fillStyle = c[1];
    ctx.beginPath();
    ctx.arc(tx, ty, 3.4, 0, TAU);
    ctx.fill();
  }
}

function tube(W, x, y, h, seed, c) {
  const { ctx } = W;
  const sway = current(W, x, seed);
  for (let i = 0; i < 5; i++) {
    const tx = x + (i - 2) * h * 0.22 + sway * 3 * (1 + i * 0.1);
    const th = h * (0.55 + ((i * 37) % 5) * 0.11);
    const tw = h * 0.1;
    const g = ctx.createLinearGradient(tx - tw, 0, tx + tw, 0);
    g.addColorStop(0, c[0]);
    g.addColorStop(0.5, c[1]);
    g.addColorStop(1, c[0]);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.rect(tx - tw, y - th, tw * 2, th);
    ctx.fill();
    ctx.fillStyle = "rgba(20,10,40,0.45)";
    ctx.beginPath();
    ctx.ellipse(tx, y - th, tw, tw * 0.45, 0, 0, TAU);
    ctx.fill();
  }
}

function drawCoral(W, c) {
  const { ctx } = W;
  const x = c.x * W.w + (W.sx - 0.5) * (c.front ? 22 : 10);
  const y = W.h - W.h * (c.front ? 0.012 : 0.03);
  const h = c.h * W.h;
  ctx.globalAlpha = c.front ? 0.9 : c.dim ? 0.32 : 0.45;
  ctx.lineCap = "round";
  if (c.kind === "branch") {
    ctx.strokeStyle = c.color[0];
    for (let i = -1; i <= 1; i++) branch(W, x + i * h * 0.16, y, -Math.PI / 2 + i * 0.28, h * 0.34, 3, c.seed + i, c.color[1], h * 0.05 + 2);
  } else if (c.kind === "fan") fan(W, x, y, h, c.seed, c.color);
  else if (c.kind === "brain") brain(W, x, y, h, c.seed, c.color);
  else if (c.kind === "anemone") anemone(W, x, y, h, c.seed, c.color);
  else tube(W, x, y, h, c.seed, c.color);
  ctx.globalAlpha = 1;
}

export const feedScene = {
  init(W) {
    W.s = { corals: [] };
    layout(W);
  },
  resize(W) {
    if (W.s) layout(W);
  },
  back(W) {
    const { ctx } = W;
    if (!W.s) return;
    // sandy floor: two low dunes
    const g = ctx.createLinearGradient(0, W.h * 0.9, 0, W.h);
    g.addColorStop(0, W.light ? "rgba(120,190,200,0.55)" : "rgba(14,72,86,0.9)");
    g.addColorStop(1, W.light ? "rgba(80,150,170,0.8)" : "rgba(4,30,42,1)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, W.h);
    ctx.lineTo(0, W.h * 0.955);
    for (let x = 0; x <= W.w; x += 40) ctx.lineTo(x, W.h * (0.945 + 0.012 * Math.sin(x * 0.006 + 1) + 0.008 * Math.sin(x * 0.017)));
    ctx.lineTo(W.w, W.h * 0.955);
    ctx.lineTo(W.w, W.h);
    ctx.closePath();
    ctx.fill();
    W.s.corals.filter((c) => !c.front).forEach((c) => drawCoral(W, c));
  },
  front(W) {
    if (!W.s) return;
    W.s.corals.filter((c) => c.front).forEach((c) => drawCoral(W, c));
  },
};
