/* ================================================================
   art.js — Nox, the owlets and the little drawing helpers.
   Pure canvas drawing, no game state, so React can use it too
   (the mascot on the title card).
   ================================================================ */

export const INK = "#1b1530";
export const TAU = Math.PI * 2;

/* tiny seeded random so the grass looks the same every load */
export function rng(seed) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/* ---------- drawing helpers ---------- */
export function rr(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
export function ell(g, x, y, rx, ry, rot = 0) { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, TAU); }
export function circ(g, x, y, r) { g.beginPath(); g.arc(x, y, r, 0, TAU); }
export function paint(g, fill, stroke = INK, lw = 2.5) {
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); }
}
export function shadow(g, x, y, rx, ry) { ell(g, x, y, rx, ry); g.fillStyle = "rgba(10,10,30,.28)"; g.fill(); }

/* ================================================================
   Characters
   ================================================================ */
export function drawOwl(g, x, y, s, o = {}) {
  const t = o.t || 0, look = o.look || { x: 0, y: 0 };
  const flap = o.still ? 0 : (Math.sin(t * 16) * .5 + .5);
  const blink = !o.dizzy && ((t + 1.5) % 3.7) < .12;
  g.save(); g.translate(x, y); g.scale(s, s);
  g.lineJoin = "round"; g.lineCap = "round";

  if (!o.noShadow) shadow(g, 0, 19, 13, 4);

  // wings
  for (const side of [-1, 1]) {
    g.save(); g.translate(side * 12, -2); g.rotate(side * (.25 + flap * .55));
    ell(g, side * 2, 7, 6, 11); paint(g, "#9a5a2c");
    g.restore();
  }
  // ear tufts
  for (const side of [-1, 1]) {
    g.beginPath(); g.moveTo(side * 5, -12); g.lineTo(side * 13, -21); g.lineTo(side * 12, -9); g.closePath();
    paint(g, "#b8692f");
  }
  // body
  ell(g, 0, 2, 14, 16); paint(g, "#c97c3c");
  // belly
  ell(g, 0, 8, 9, 9); paint(g, "#f6dcaa", null);
  g.strokeStyle = "#d9a56a"; g.lineWidth = 1.6;
  for (const [vx, vy] of [[-3.5, 5], [3.5, 5], [0, 9], [-4, 12], [4, 12]]) {
    g.beginPath(); g.moveTo(vx - 1.8, vy - 1); g.lineTo(vx, vy + .8); g.lineTo(vx + 1.8, vy - 1); g.stroke();
  }
  // face discs
  for (const side of [-1, 1]) { circ(g, side * 6.3, -4, 7.6); paint(g, "#fbecc9", INK, 2); }
  // eyes
  for (const side of [-1, 1]) {
    const ex = side * 6.3, ey = -4;
    if (o.dizzy) {
      g.strokeStyle = INK; g.lineWidth = 2;
      g.beginPath(); g.moveTo(ex - 3, ey - 3); g.lineTo(ex + 3, ey + 3); g.moveTo(ex + 3, ey - 3); g.lineTo(ex - 3, ey + 3); g.stroke();
    } else if (blink) {
      g.strokeStyle = INK; g.lineWidth = 2.2;
      g.beginPath(); g.moveTo(ex - 4, ey); g.quadraticCurveTo(ex, ey + 2.5, ex + 4, ey); g.stroke();
    } else {
      circ(g, ex, ey, 5.2); paint(g, "#ffd23f", INK, 1.6);
      circ(g, ex + look.x * 1.7, ey + look.y * 1.7, 2.9); g.fillStyle = INK; g.fill();
      circ(g, ex + look.x * 1.7 - 1, ey + look.y * 1.7 - 1.1, 1); g.fillStyle = "#fff"; g.fill();
    }
  }
  // beak
  g.beginPath(); g.moveTo(-2.8, .5); g.lineTo(2.8, .5); g.lineTo(0, 5.5); g.closePath(); paint(g, "#ff9f1c", INK, 1.6);
  // feet
  for (const side of [-1, 1]) { ell(g, side * 5, 17.5, 3.4, 2); paint(g, "#ff9f1c", INK, 1.5); }

  if (o.dizzy) {
    for (let i = 0; i < 3; i++) {
      const a = t * 6 + i * TAU / 3;
      star(g, Math.cos(a) * 14, -24 + Math.sin(a) * 4, 3.6, "#ffe066");
    }
  }
  g.restore();
}

export function drawOwlet(g, x, y, s, t, look = { x: 0, y: 0 }) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.lineJoin = "round";
  shadow(g, 0, 14, 9, 3);
  for (const side of [-1, 1]) {
    g.beginPath(); g.moveTo(side * 4, -8); g.lineTo(side * 9, -15); g.lineTo(side * 9, -6); g.closePath(); paint(g, "#a99fd9", INK, 2);
  }
  ell(g, 0, 2, 11, 12.5); paint(g, "#c3bbef", INK, 2.2);
  ell(g, 0, 6, 6.5, 6); paint(g, "#efe9ff", null);
  for (const side of [-1, 1]) {
    circ(g, side * 4.6, -2, 4.3); paint(g, "#fff", INK, 1.8);
    circ(g, side * 4.6 + look.x * 1.3, -2 + look.y * 1.3, 2.2); g.fillStyle = INK; g.fill();
  }
  g.beginPath(); g.moveTo(-1.8, 1.6); g.lineTo(1.8, 1.6); g.lineTo(0, 4.4); g.closePath(); paint(g, "#ff9f1c", INK, 1.3);
  g.restore();
}

export function star(g, x, y, r, color) {
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r * .45 : r;
    g.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
  }
  g.closePath(); paint(g, color, INK, 1.2);
}

