// Vector animals and plants for the special scenes. Each one is drawn in its own local space,
// facing right (nose toward +x), so the scene can move, turn and mirror it.

const TAU = Math.PI * 2;

// ---------------------------------------------------------------- whale
// L is the body length. `tail` is -1..1 and swings the flukes.
export function drawWhale(ctx, L, tail, color, belly) {
  const T = tail * L * 0.035;
  ctx.save();
  const g = ctx.createLinearGradient(0, -L * 0.13, 0, L * 0.14);
  g.addColorStop(0, color);
  g.addColorStop(0.62, color);
  g.addColorStop(1, belly);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(L * 0.5, L * 0.02);
  ctx.bezierCurveTo(L * 0.47, -L * 0.06, L * 0.36, -L * 0.1, L * 0.2, -L * 0.115);
  ctx.bezierCurveTo(L * 0.0, -L * 0.13, -L * 0.2, -L * 0.09, -L * 0.34, -L * 0.03 + T * 0.4);
  // tail stock and flukes
  ctx.lineTo(-L * 0.4, -L * 0.012 + T);
  ctx.bezierCurveTo(-L * 0.44, -L * 0.07 + T, -L * 0.5, -L * 0.13 + T * 1.3, -L * 0.53, -L * 0.15 + T * 1.3);
  ctx.bezierCurveTo(-L * 0.5, -L * 0.07 + T, -L * 0.46, -L * 0.02 + T, -L * 0.44, 0 + T);
  ctx.bezierCurveTo(-L * 0.46, L * 0.02 + T, -L * 0.5, L * 0.07 + T, -L * 0.53, L * 0.15 + T * 0.7);
  ctx.bezierCurveTo(-L * 0.5, L * 0.13 + T, -L * 0.44, L * 0.07 + T, -L * 0.4, L * 0.012 + T);
  ctx.lineTo(-L * 0.34, L * 0.04 + T * 0.4);
  ctx.bezierCurveTo(-L * 0.2, L * 0.1, L * 0.0, L * 0.14, L * 0.22, L * 0.125);
  ctx.bezierCurveTo(L * 0.38, L * 0.11, L * 0.47, L * 0.07, L * 0.5, L * 0.02);
  ctx.closePath();
  ctx.fill();

  // dorsal fin and flipper
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-L * 0.22, -L * 0.085);
  ctx.quadraticCurveTo(-L * 0.2, -L * 0.14, -L * 0.15, -L * 0.15);
  ctx.quadraticCurveTo(-L * 0.16, -L * 0.11, -L * 0.13, -L * 0.1);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(L * 0.16, L * 0.09);
  ctx.quadraticCurveTo(L * 0.1, L * 0.19, L * 0.02, L * 0.21);
  ctx.quadraticCurveTo(L * 0.09, L * 0.15, L * 0.11, L * 0.1);
  ctx.closePath();
  ctx.fill();

  // throat grooves and eye
  ctx.strokeStyle = "rgba(255,255,255,0.13)";
  ctx.lineWidth = Math.max(1, L * 0.002);
  for (let i = 0; i < 7; i++) {
    const y = L * (0.04 + i * 0.012);
    ctx.beginPath();
    ctx.moveTo(L * 0.44, y * 0.7);
    ctx.quadraticCurveTo(L * 0.2, y * 1.35, -L * 0.02, y * 1.15);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(4,16,28,0.7)";
  ctx.beginPath();
  ctx.arc(L * 0.4, L * 0.005, L * 0.0055, 0, TAU);
  ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------- dolphin
export function drawDolphin(ctx, L, tail) {
  const T = tail * L * 0.045;
  ctx.save();
  const g = ctx.createLinearGradient(0, -L * 0.1, 0, L * 0.1);
  g.addColorStop(0, "#4f7f9c");
  g.addColorStop(0.55, "#7fb0c6");
  g.addColorStop(1, "#e2eff5");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(L * 0.5, L * 0.018); // tip of the beak
  ctx.lineTo(L * 0.37, -L * 0.012);
  ctx.bezierCurveTo(L * 0.33, -L * 0.075, L * 0.22, -L * 0.1, L * 0.06, -L * 0.1);
  ctx.bezierCurveTo(-L * 0.1, -L * 0.1, -L * 0.24, -L * 0.06, -L * 0.34, -L * 0.025 + T * 0.4);
  ctx.lineTo(-L * 0.4, -L * 0.006 + T);
  // flukes
  ctx.bezierCurveTo(-L * 0.44, -L * 0.05 + T, -L * 0.48, -L * 0.09 + T * 1.3, -L * 0.52, -L * 0.1 + T * 1.3);
  ctx.bezierCurveTo(-L * 0.49, -L * 0.04 + T, -L * 0.47, -L * 0.01 + T, -L * 0.455, T);
  ctx.bezierCurveTo(-L * 0.47, L * 0.01 + T, -L * 0.49, L * 0.04 + T, -L * 0.52, L * 0.1 + T * 0.7);
  ctx.bezierCurveTo(-L * 0.48, L * 0.09 + T, -L * 0.44, L * 0.05 + T, -L * 0.4, L * 0.006 + T);
  ctx.lineTo(-L * 0.34, L * 0.028 + T * 0.4);
  ctx.bezierCurveTo(-L * 0.2, L * 0.07, -L * 0.02, L * 0.095, L * 0.14, L * 0.085);
  ctx.bezierCurveTo(L * 0.27, L * 0.075, L * 0.33, L * 0.05, L * 0.37, L * 0.035);
  ctx.closePath();
  ctx.fill();

  // dorsal fin, flipper
  ctx.fillStyle = "#4a7893";
  ctx.beginPath();
  ctx.moveTo(-L * 0.01, -L * 0.098);
  ctx.quadraticCurveTo(-L * 0.06, -L * 0.2, -L * 0.14, -L * 0.19);
  ctx.quadraticCurveTo(-L * 0.12, -L * 0.13, -L * 0.13, -L * 0.09);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(L * 0.2, L * 0.06);
  ctx.quadraticCurveTo(L * 0.17, L * 0.15, L * 0.09, L * 0.17);
  ctx.quadraticCurveTo(L * 0.13, L * 0.11, L * 0.14, L * 0.07);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#04121f";
  ctx.beginPath();
  ctx.arc(L * 0.3, -L * 0.012, L * 0.0075, 0, TAU);
  ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------- kelp
// A strand of kelp rooted at (x, baseY), height h, swaying with the current.
export function drawKelp(ctx, x, baseY, h, t, seed, color, width = 7) {
  const seg = 9;
  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  let px = x;
  let py = baseY;
  for (let i = 1; i <= seg; i++) {
    const k = i / seg;
    const sway = Math.sin(t * 0.7 + seed + k * 2.2) * (h * 0.09) * k + Math.sin(t * 0.33 + seed * 2) * (h * 0.05) * k;
    const nx = x + sway;
    const ny = baseY - h * k;
    ctx.lineWidth = Math.max(1.2, width * (1 - k * 0.7));
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(nx, ny);
    ctx.stroke();
    px = nx;
    py = ny;
  }
}

// ---------------------------------------------------------------- shark
export function drawShark(ctx, L, tail, color, belly) {
  const T = tail * L * 0.03;
  ctx.save();
  const g = ctx.createLinearGradient(0, -L * 0.09, 0, L * 0.09);
  g.addColorStop(0, color);
  g.addColorStop(0.55, color);
  g.addColorStop(1, belly);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(L * 0.5, L * 0.012); // snout
  ctx.bezierCurveTo(L * 0.42, -L * 0.05, L * 0.28, -L * 0.085, L * 0.08, -L * 0.085);
  ctx.bezierCurveTo(-L * 0.12, -L * 0.085, -L * 0.28, -L * 0.05, -L * 0.36, -L * 0.015 + T * 0.4);
  // tail: a long upper lobe and a shorter lower one
  ctx.lineTo(-L * 0.42, -L * 0.005 + T);
  ctx.bezierCurveTo(-L * 0.45, -L * 0.07 + T, -L * 0.5, -L * 0.14 + T * 1.3, -L * 0.54, -L * 0.17 + T * 1.3);
  ctx.bezierCurveTo(-L * 0.51, -L * 0.08 + T, -L * 0.49, -L * 0.03 + T, -L * 0.47, T);
  ctx.bezierCurveTo(-L * 0.49, L * 0.03 + T, -L * 0.5, L * 0.07 + T, -L * 0.5, L * 0.09 + T * 0.8);
  ctx.bezierCurveTo(-L * 0.46, L * 0.06 + T, -L * 0.43, L * 0.03 + T, -L * 0.4, L * 0.005 + T);
  ctx.lineTo(-L * 0.34, L * 0.02 + T * 0.4);
  ctx.bezierCurveTo(-L * 0.2, L * 0.06, L * 0.0, L * 0.085, L * 0.18, L * 0.07);
  ctx.bezierCurveTo(L * 0.34, L * 0.055, L * 0.45, L * 0.03, L * 0.5, L * 0.012);
  ctx.closePath();
  ctx.fill();
  // dorsal and pectoral fins
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(L * 0.06, -L * 0.083);
  ctx.quadraticCurveTo(L * 0.0, -L * 0.2, -L * 0.1, -L * 0.2);
  ctx.quadraticCurveTo(-L * 0.06, -L * 0.13, -L * 0.1, -L * 0.082);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(L * 0.16, L * 0.06);
  ctx.quadraticCurveTo(L * 0.06, L * 0.15, -L * 0.06, L * 0.17);
  ctx.quadraticCurveTo(L * 0.03, L * 0.1, L * 0.06, L * 0.07);
  ctx.closePath();
  ctx.fill();
  // gills and eye
  ctx.strokeStyle = "rgba(0,10,30,0.22)";
  ctx.lineWidth = Math.max(1, L * 0.003);
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(L * (0.2 - i * 0.02), -L * 0.03);
    ctx.quadraticCurveTo(L * (0.19 - i * 0.02), 0, L * (0.2 - i * 0.02), L * 0.03);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(0,8,20,0.7)";
  ctx.beginPath();
  ctx.arc(L * 0.36, -L * 0.018, L * 0.006, 0, TAU);
  ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------- squid
// A glowing squid in local space, facing UP (nose toward -y). `hue` shifts its colour; `pulse` is
// 0..1 (the mantle breathing); the fins and arms trail below.
export function drawSquid(ctx, S, t, hue, glow) {
  const hsl = (h, s, l, a = 1) => `hsla(${h}, ${s}%, ${l}%, ${a})`;
  ctx.save();
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.2);

  // trailing arms first (behind the body), each a wavy line ending in a soft point of light
  ctx.lineCap = "round";
  for (let i = 0; i < 8; i++) {
    const k = i / 7 - 0.5;
    ctx.strokeStyle = hsl(hue + i * 6, 80, 62, 0.85);
    ctx.lineWidth = Math.max(1.6, S * 0.03);
    ctx.beginPath();
    ctx.moveTo(k * S * 0.16, S * 0.14);
    for (let n = 1; n <= 10; n++) {
      const f = n / 10;
      const x = k * S * (0.16 + f * 0.22) + Math.sin(t * 2 + i + f * 4) * S * 0.05 * f;
      const y = S * (0.14 + f * 0.55);
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // mantle
  const g = ctx.createLinearGradient(0, -S * 0.45, 0, S * 0.15);
  g.addColorStop(0, hsl(hue + 20, 85, 72));
  g.addColorStop(0.5, hsl(hue, 80, 55));
  g.addColorStop(1, hsl(hue - 20, 75, 42));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, -S * 0.5);
  ctx.bezierCurveTo(S * (0.2 + pulse * 0.02), -S * 0.3, S * (0.16 + pulse * 0.02), S * 0.05, S * 0.09, S * 0.15);
  ctx.lineTo(-S * 0.09, S * 0.15);
  ctx.bezierCurveTo(-S * (0.16 + pulse * 0.02), S * 0.05, -S * (0.2 + pulse * 0.02), -S * 0.3, 0, -S * 0.5);
  ctx.closePath();
  ctx.fill();
  // fins
  ctx.fillStyle = hsl(hue + 30, 85, 66, 0.9);
  [-1, 1].forEach((sd) => {
    ctx.beginPath();
    ctx.moveTo(sd * S * 0.03, -S * 0.5);
    ctx.quadraticCurveTo(sd * S * (0.3 + pulse * 0.03), -S * 0.42, sd * S * 0.15, -S * 0.2);
    ctx.quadraticCurveTo(sd * S * 0.1, -S * 0.35, sd * S * 0.03, -S * 0.5);
    ctx.fill();
  });
  // glowing dots along the mantle
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 9; i++) {
    const f = i / 8;
    const y = -S * 0.4 + f * S * 0.5;
    const a = 0.35 + 0.65 * Math.abs(Math.sin(t * 1.6 + i * 0.9));
    ctx.fillStyle = hsl(hue + 40, 100, 78, a);
    [-1, 1].forEach((sd) => {
      ctx.beginPath();
      ctx.arc(sd * S * (0.045 + Math.sin(f * 3) * 0.05), y, Math.max(1.4, S * 0.012), 0, Math.PI * 2);
      ctx.fill();
    });
  }
  // aura
  const aura = ctx.createRadialGradient(0, -S * 0.15, 0, 0, -S * 0.15, S * 0.85);
  aura.addColorStop(0, hsl(hue, 100, 62, 0.28 * glow));
  aura.addColorStop(1, hsl(hue, 100, 62, 0));
  ctx.fillStyle = aura;
  ctx.fillRect(-S, -S, S * 2, S * 2);
  ctx.globalCompositeOperation = "source-over";
  // eyes
  ctx.fillStyle = "#031018";
  [-1, 1].forEach((sd) => {
    ctx.beginPath();
    ctx.arc(sd * S * 0.07, -S * 0.02, S * 0.024, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}
