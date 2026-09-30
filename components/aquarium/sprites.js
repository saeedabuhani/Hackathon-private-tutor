// Offscreen sprites, drawn once and stamped every frame (cheap): fish (with a tail that bends over
// six frames), a bubble and a soft glow. Fish are simple shapes (body, tail, fin, eye), not images.

const FRAMES = 6;
const FW = 112;
const FH = 64;

// three body shapes so the school does not look cloned
const SHAPES = [
  { len: 0.31, hgt: 0.3, fin: 0.34, name: "round" },
  { len: 0.36, hgt: 0.2, fin: 0.2, name: "slim" },
  { len: 0.27, hgt: 0.38, fin: 0.44, name: "tall" },
];

function fishFrame(g, colors, shape, bend) {
  const [body, fin, belly] = colors;
  const cx = FW * 0.58;
  const cy = FH * 0.5;
  const rx = FW * shape.len;
  const ry = FH * shape.hgt;

  // tail: a fan behind the body that swings with the bend
  const tx = cx - rx * 0.85;
  g.fillStyle = fin;
  g.beginPath();
  g.moveTo(tx + 6, cy);
  g.quadraticCurveTo(tx - 10, cy - ry * 0.9 + bend * 9, tx - 22, cy - ry * 1.15 + bend * 15);
  g.quadraticCurveTo(tx - 12, cy + bend * 7, tx - 22, cy + ry * 1.15 + bend * 15);
  g.quadraticCurveTo(tx - 10, cy + ry * 0.9 + bend * 9, tx + 6, cy);
  g.closePath();
  g.fill();

  // dorsal fin
  g.beginPath();
  g.moveTo(cx - rx * 0.4, cy - ry * 0.8);
  g.quadraticCurveTo(cx - rx * 0.05, cy - ry * (1 + shape.fin), cx + rx * 0.35, cy - ry * 0.75);
  g.closePath();
  g.fill();

  // body
  const grad = g.createLinearGradient(0, cy - ry, 0, cy + ry);
  grad.addColorStop(0, body);
  grad.addColorStop(0.62, body);
  grad.addColorStop(1, belly);
  g.fillStyle = grad;
  g.beginPath();
  g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  g.fill();

  // a stripe of fin colour for character
  g.save();
  g.beginPath();
  g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  g.clip();
  g.fillStyle = fin;
  g.globalAlpha = 0.5;
  g.fillRect(cx - rx * 0.28, 0, rx * 0.16, FH);
  g.restore();

  // eye
  g.fillStyle = "#fff";
  g.beginPath();
  g.arc(cx + rx * 0.55, cy - ry * 0.18, ry * 0.26, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#04121f";
  g.beginPath();
  g.arc(cx + rx * 0.6, cy - ry * 0.18, ry * 0.13, 0, Math.PI * 2);
  g.fill();
}

// atlas[colorIndex][shapeIndex] = one offscreen canvas with FRAMES frames side by side
export function buildFishAtlas(colors) {
  return colors.map((c) =>
    SHAPES.map((shape) => {
      const cv = document.createElement("canvas");
      cv.width = FW * FRAMES;
      cv.height = FH;
      const g = cv.getContext("2d");
      for (let f = 0; f < FRAMES; f++) {
        g.save();
        g.translate(FW * f, 0);
        fishFrame(g, c, shape, Math.sin((f / FRAMES) * Math.PI * 2));
        g.restore();
      }
      return cv;
    })
  );
}

// draws one frame, facing right at (x, y); dir is 1 or -1, size scales the sprite
export function drawFish(ctx, atlas, x, y, dir, size, phase, angle) {
  const f = Math.floor(((phase % 1) + 1) % 1 * FRAMES);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle * dir);
  ctx.scale(dir * size, size);
  ctx.drawImage(atlas, f * FW, 0, FW, FH, -FW * 0.5, -FH * 0.5, FW, FH);
  ctx.restore();
}

export const FISH_W = FW;

export function buildBubble() {
  const cv = document.createElement("canvas");
  cv.width = cv.height = 64;
  const g = cv.getContext("2d");
  const grad = g.createRadialGradient(24, 22, 2, 32, 32, 30);
  grad.addColorStop(0, "rgba(255,255,255,0.55)");
  grad.addColorStop(0.55, "rgba(180,235,255,0.08)");
  grad.addColorStop(1, "rgba(160,225,255,0.35)");
  g.fillStyle = grad;
  g.beginPath();
  g.arc(32, 32, 30, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "rgba(210,245,255,0.7)";
  g.lineWidth = 2;
  g.beginPath();
  g.arc(32, 32, 29, 0, Math.PI * 2);
  g.stroke();
  g.fillStyle = "rgba(255,255,255,0.85)";
  g.beginPath();
  g.ellipse(21, 19, 6, 3.4, -0.6, 0, Math.PI * 2);
  g.fill();
  return cv;
}

export function buildGlow(rgb) {
  const cv = document.createElement("canvas");
  cv.width = cv.height = 64;
  const g = cv.getContext("2d");
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, `rgba(${rgb},1)`);
  grad.addColorStop(0.2, `rgba(${rgb},0.5)`);
  grad.addColorStop(0.55, `rgba(${rgb},0.1)`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return cv;
}
