/* ==============================================================
   engine.js — the park in perspective, from where you stand
   --------------------------------------------------------------
   world.js describes the park from above, in metres. This file
   puts a camera at your eye, 1.65 m up, and every frame projects
   the ground shapes, fences and sprites onto the screen:

       screen x = 600 + (x_rel / depth) * F
       screen y = H   + ((eye - height) / depth) * F

   where x_rel and depth are the point's position relative to you
   after turning by your heading. Nearer things are bigger and
   lower on the screen, the horizon sits at y = H, and everything
   is drawn back to front.

   You move with the keys (or the pad on a touch screen), drag the
   scene to look around, and the gate opens as you approach it.
   The mini map and the compass strip follow along.
   ============================================================== */

import { WORLD } from "./world.js";
import { ZONES } from "./config.js";
import { lampMarkup } from "./lamps.js";
import { setHintOverride } from "./panel.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const DEG = Math.PI / 180;

const F    = 860;    // focal length: ~70° across the 1200-unit view
const H    = 416;    // horizon
const EYE  = 1.65;   // metres
const NEAR = 0.45;   // nothing closer than this is drawn
const FAR  = 150;

const WALK_SPEED = 3.6;    // m/s
const TURN_SPEED = 95;     // deg/s with the keys
const DRAG_TURN  = 0.22;   // deg per screen pixel dragged

const cam = { x: WORLD.start.x, z: WORLD.start.z, yaw: WORLD.start.yaw };

const el = {};
const items = [];          // everything depth-sorted: sprites, fences, gate leaves
const grounds = [];        // flat shapes, fixed order
let gate = 0;              // 0 shut .. 1 open
let gateOpening = false;
let lastOrder = "";
let insidePark = false;


/* ==================== projection ==================== */

function toCamera(x, z) {
    const dx = x - cam.x, dz = z - cam.z;
    const s = Math.sin(cam.yaw * DEG), c = Math.cos(cam.yaw * DEG);
    return { rx: dx * c - dz * s, rz: dx * s + dz * c };
}

function project(rx, rz, y = 0) {
    return { x: 600 + (rx / rz) * F, y: H + ((EYE - y) / rz) * F };
}

/** Clip a polygon of camera-space points {rx, rz, y} to rz >= NEAR. */
function clipNear(poly) {
    const out = [];
    for (let i = 0; i < poly.length; i++) {
        const a = poly[i], b = poly[(i + 1) % poly.length];
        const aIn = a.rz >= NEAR, bIn = b.rz >= NEAR;
        if (aIn) out.push(a);
        if (aIn !== bIn) {
            const t = (NEAR - a.rz) / (b.rz - a.rz);
            out.push({ rx: a.rx + (b.rx - a.rx) * t, rz: NEAR, y: a.y + (b.y - a.y) * t });
        }
    }
    return out;
}

/** Clip a segment to rz >= NEAR; null if entirely behind. */
function clipSeg(a, b) {
    if (a.rz < NEAR && b.rz < NEAR) return null;
    if (a.rz >= NEAR && b.rz >= NEAR) return [a, b];
    const t = (NEAR - a.rz) / (b.rz - a.rz);
    const m = { rx: a.rx + (b.rx - a.rx) * t, rz: NEAR, y: a.y + (b.y - a.y) * t };
    return a.rz < NEAR ? [m, b] : [a, m];
}

const fmt = n => n.toFixed(1);


/* ==================== building the scene ==================== */

function make(tag, attrs = {}) {
    const node = document.createElementNS(SVG_NS, tag);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    return node;
}

function buildGround() {
    WORLD.ground.forEach(shape => {
        const node = make("path", { fill: shape.fill });
        if (shape.filter)  node.setAttribute("filter", shape.filter);
        if (shape.opacity) node.setAttribute("opacity", shape.opacity);
        el.ground.appendChild(node);
        const y = shape.y || 0;
        grounds.push({ node, pts: shape.pts.map(p => ({ x: p[0], z: p[1], y: p.length > 2 ? p[2] : y })) });
    });
    WORLD.groundLines.forEach(line => {
        const node = make("path", { fill: "none", stroke: line.stroke, "stroke-linecap": "round" });
        if (line.opacity) node.setAttribute("opacity", line.opacity);
        el.ground.appendChild(node);
        grounds.push({ node, line, pts: line.pts.map(p => ({ x: p[0], z: p[1], y: line.y || 0 })) });
    });
}

function buildSprite(tpl, x, z, u, y = 0, extra = {}) {
    const node = make("g", { class: "sprite" });
    const template = document.getElementById(tpl);
    const clone = template.cloneNode(true);
    clone.removeAttribute("id");
    node.appendChild(clone);
    el.items.appendChild(node);
    items.push({ kind: "sprite", node, x, z, u, y, ...extra });
    return node;
}

function buildSprites() {
    WORLD.sprites.forEach(s => buildSprite(s.tpl, s.x, s.z, s.u, s.y || 0));

    // the four lamp posts, placed from world.js and drawn by lamps.js
    ZONES.forEach(zone => {
        const at = WORLD.lamps[zone.id];
        const node = make("g", { class: "sprite" });
        node.innerHTML = lampMarkup(zone);
        el.items.appendChild(node);
        items.push({ kind: "sprite", node, x: at.x, z: at.z, u: 55, y: 0 });
    });
}

function buildFences() {
    WORLD.fences.forEach(f => {
        const node = make("g");
        const post  = make("line", { stroke: f.post, "stroke-linecap": "round" });
        node.appendChild(post);
        const rails = f.rails.map(() => { const r = make("line", { stroke: f.rail, "stroke-linecap": "round" }); node.appendChild(r); return r; });
        el.items.appendChild(node);
        items.push({ kind: "fence", node, post, rails, f, x: (f.a[0] + f.b[0]) / 2, z: (f.a[1] + f.b[1]) / 2 });
    });
}

function buildBasin() {
    const fnt = WORLD.fountain;
    if (!fnt) return;
    const far  = make("g");
    const inner = make("path", { fill: "#aaa494" }); far.appendChild(inner);
    const rim   = make("path", { fill: "#c4beae", "fill-rule": "evenodd" }); far.appendChild(rim);
    el.items.appendChild(far);
    items.push({ kind: "basin", half: "far", node: far, inner, rim, x: fnt.cx, z: fnt.cz });

    const near = make("g");
    const outer = make("path", { fill: "#9a9484" }); near.appendChild(outer);
    const shade = make("path", { fill: "#000", opacity: 0.18 }); near.appendChild(shade);
    el.items.appendChild(near);
    items.push({ kind: "basin", half: "near", node: near, outer, shade, x: fnt.cx, z: fnt.cz });
}

function buildGate() {
    const g = WORLD.gate;
    ["left", "right"].forEach(side => {
        const node = make("g", { fill: "none", stroke: "#1f2329", "stroke-linecap": "round", "stroke-linejoin": "round" });
        const frame = make("path"); node.appendChild(frame);
        const bars  = make("path"); node.appendChild(bars);
        el.items.appendChild(node);
        items.push({ kind: "leaf", node, frame, bars, side, x: side === "left" ? -g.halfGap : g.halfGap, z: g.z });
    });
    // the arch over the gate
    const node = make("g");
    const arc  = make("path", { fill: "none", stroke: "#1f2329", "stroke-linecap": "round" });
    node.append(arc);
    el.items.appendChild(node);
    items.push({ kind: "arch", node, arc, x: 0, z: g.z });
}


/* ==================== drawing a frame ==================== */

function drawGround() {
    grounds.forEach(gnd => {
        const cs = gnd.pts.map(p => ({ ...toCamera(p.x, p.z), y: p.y }));

        if (gnd.line) {
            const seg = clipSeg(cs[0], cs[1]);
            if (!seg) { gnd.node.setAttribute("d", ""); return; }
            const a = project(seg[0].rx, seg[0].rz, seg[0].y), b = project(seg[1].rx, seg[1].rz, seg[1].y);
            const depth = Math.min(seg[0].rz, seg[1].rz);
            gnd.node.setAttribute("d", `M${fmt(a.x)} ${fmt(a.y)} L${fmt(b.x)} ${fmt(b.y)}`);
            gnd.node.setAttribute("stroke-width", Math.max(0.6, gnd.line.width * F / depth).toFixed(2));
            if (gnd.line.dash) gnd.node.setAttribute("stroke-dasharray", gnd.line.dash.split(" ").map(v => (v * F / depth).toFixed(1)).join(" "));
            return;
        }

        const clipped = clipNear(cs);
        if (clipped.length < 3) { gnd.node.setAttribute("d", ""); return; }
        gnd.node.setAttribute("d", clipped.map((p, i) => {
            const s = project(p.rx, p.rz, p.y);
            return `${i ? "L" : "M"}${fmt(s.x)} ${fmt(s.y)}`;
        }).join(" ") + " Z");
    });
}

function drawSprite(it) {
    const c = toCamera(it.x, it.z);
    if (c.rz < NEAR || c.rz > FAR) return false;
    const s = project(c.rx, c.rz, it.y);
    if (s.x < -600 || s.x > 1800) return false;
    const k = (F / c.rz) / it.u;
    it.node.setAttribute("transform", `translate(${fmt(s.x)} ${fmt(s.y)}) scale(${k.toFixed(4)})`);
    it.node.setAttribute("opacity", Math.max(0.25, Math.min(1, 1 - (c.rz - 50) / 110)).toFixed(2));
    it.depth = c.rz;
    return true;
}

function drawFence(it) {
    const f = it.f;
    const a = toCamera(f.a[0], f.a[1]), b = toCamera(f.b[0], f.b[1]);
    if ((a.rz < NEAR && b.rz < NEAR) || Math.min(a.rz, b.rz) > FAR) return false;

    // post
    if (a.rz >= NEAR) {
        const bottom = project(a.rx, a.rz, f.base), top = project(a.rx, a.rz, f.base + f.postH);
        it.post.setAttribute("x1", fmt(bottom.x)); it.post.setAttribute("y1", fmt(bottom.y));
        it.post.setAttribute("x2", fmt(top.x));    it.post.setAttribute("y2", fmt(top.y));
        it.post.setAttribute("stroke-width", Math.max(0.8, f.w * F / a.rz).toFixed(2));
        it.post.style.display = "";
    } else it.post.style.display = "none";

    // rails
    it.rails.forEach((rail, i) => {
        const h = f.base + f.rails[i];
        const seg = clipSeg({ ...a, y: h }, { ...b, y: h });
        if (!seg) { rail.style.display = "none"; return; }
        const p = project(seg[0].rx, seg[0].rz, h), q = project(seg[1].rx, seg[1].rz, h);
        rail.setAttribute("x1", fmt(p.x)); rail.setAttribute("y1", fmt(p.y));
        rail.setAttribute("x2", fmt(q.x)); rail.setAttribute("y2", fmt(q.y));
        rail.setAttribute("stroke-width", Math.max(0.6, f.w * 0.8 * F / Math.min(seg[0].rz, seg[1].rz)).toFixed(2));
        rail.style.display = "";
    });

    it.depth = Math.min(a.rz, b.rz);
    return true;
}

function drawLeaf(it) {
    const g = WORLD.gate;
    const angle = gate * 90 * DEG;
    const dir = it.side === "left" ? 1 : -1;
    const hx = it.x, hz = it.z;
    const fx = hx + dir * Math.cos(angle) * g.leaf, fz = hz + Math.sin(angle) * g.leaf;

    const hinge = toCamera(hx, hz), free = toCamera(fx, fz);
    if (hinge.rz < NEAR || free.rz < NEAR) return false;

    const h0 = 0.1, h1 = 2.1;
    const P = (c, y) => project(c.rx, c.rz, y);
    const a = P(hinge, h0), b = P(free, h0), c = P(free, h1), d = P(hinge, h1);
    const top = P({ rx: (hinge.rx + free.rx) / 2, rz: (hinge.rz + free.rz) / 2 }, h1 + 0.35);

    it.frame.setAttribute("d", `M${fmt(a.x)} ${fmt(a.y)} L${fmt(b.x)} ${fmt(b.y)} L${fmt(c.x)} ${fmt(c.y)} Q${fmt(top.x)} ${fmt(top.y)} ${fmt(d.x)} ${fmt(d.y)} Z`);

    let bars = "";
    for (let i = 1; i <= 6; i++) {
        const t = i / 7;
        const base = P({ rx: hinge.rx + (free.rx - hinge.rx) * t, rz: hinge.rz + (free.rz - hinge.rz) * t }, h0);
        const up   = P({ rx: hinge.rx + (free.rx - hinge.rx) * t, rz: hinge.rz + (free.rz - hinge.rz) * t }, h1 + 0.3 * Math.sin(t * Math.PI));
        bars += `M${fmt(base.x)} ${fmt(base.y)} L${fmt(up.x)} ${fmt(up.y)} `;
    }
    // a middle rail
    const m1 = P(hinge, 1.1), m2 = P(free, 1.1);
    bars += `M${fmt(m1.x)} ${fmt(m1.y)} L${fmt(m2.x)} ${fmt(m2.y)}`;
    it.bars.setAttribute("d", bars);

    const depth = Math.min(hinge.rz, free.rz);
    it.node.setAttribute("stroke-width", Math.max(0.8, 0.05 * F / depth).toFixed(2));
    it.depth = depth;
    return true;
}

function drawArch(it) {
    const g = WORLD.gate;
    const l = toCamera(-g.halfGap, g.z), r = toCamera(g.halfGap, g.z), m = toCamera(0, g.z);
    if (l.rz < NEAR || r.rz < NEAR || m.rz > FAR) return false;

    const a = project(l.rx, l.rz, g.pillarH), b = project(r.rx, r.rz, g.pillarH);
    const apex = project(m.rx, m.rz, g.pillarH + 0.9);
    const ctrl = { x: 2 * apex.x - (a.x + b.x) / 2, y: 2 * apex.y - (a.y + b.y) / 2 };
    it.arc.setAttribute("d", `M${fmt(a.x)} ${fmt(a.y)} Q${fmt(ctrl.x)} ${fmt(ctrl.y)} ${fmt(b.x)} ${fmt(b.y)}`);
    it.arc.setAttribute("stroke-width", Math.max(1, 0.12 * F / m.rz).toFixed(2));

    it.depth = m.rz;
    return true;
}

/** Points around a circle of radius r at height y, in camera space, for
 *  the half of the circle facing (near) or facing away from (far) you. */
function basinArc(fnt, r, y, half) {
    const c = toCamera(fnt.cx, fnt.cz);
    const facing = Math.atan2(c.rx, c.rz);          // direction from you to the centre, in camera space
    const pts = [];
    const n = 22;
    for (let i = 0; i <= n; i++) {
        // angle measured in camera space; the far half is centred on `facing`
        const a = facing + (half === "far" ? 0 : Math.PI) + (i / n - 0.5) * Math.PI;
        pts.push({ rx: c.rx + Math.sin(a) * r, rz: c.rz + Math.cos(a) * r, y });
    }
    return pts;
}

function pathOf(points) {
    const clipped = clipNear(points);
    if (clipped.length < 3) return "";
    return clipped.map((p, i) => { const s = project(p.rx, p.rz, p.y); return `${i ? "L" : "M"}${fmt(s.x)} ${fmt(s.y)}`; }).join(" ") + " Z";
}

function drawBasin(it) {
    const fnt = WORLD.fountain;
    const c = toCamera(fnt.cx, fnt.cz);
    if (c.rz + fnt.rim < NEAR || c.rz - fnt.rim > FAR) return false;
    const inner = fnt.rim - fnt.wall;

    if (it.half === "far") {
        // the inside face you see above the water, and the top of the wall all the way round
        const lo = basinArc(fnt, inner, fnt.water, "far"), hi = basinArc(fnt, inner, fnt.height, "far");
        it.inner.setAttribute("d", pathOf(lo.concat(hi.reverse())));
        const ringOuter = [], ringInner = [];
        for (let i = 0; i < 40; i++) {
            const a = (i / 40) * Math.PI * 2;
            ringOuter.push({ rx: c.rx + Math.sin(a) * fnt.rim, rz: c.rz + Math.cos(a) * fnt.rim, y: fnt.height });
            ringInner.push({ rx: c.rx + Math.sin(a) * inner,   rz: c.rz + Math.cos(a) * inner,   y: fnt.height });
        }
        it.rim.setAttribute("d", pathOf(ringOuter) + " " + pathOf(ringInner));
        it.depth = c.rz + fnt.rim * 0.5;
    } else {
        // the outside face, from the ground to the top, with a band of shadow under the lip
        const lo = basinArc(fnt, fnt.rim, 0, "near"), hi = basinArc(fnt, fnt.rim, fnt.height, "near");
        it.outer.setAttribute("d", pathOf(lo.concat(hi.reverse())));
        const s1 = basinArc(fnt, fnt.rim, fnt.height - 0.12, "near"), s2 = basinArc(fnt, fnt.rim, fnt.height, "near");
        it.shade.setAttribute("d", pathOf(s1.concat(s2.reverse())));
        it.depth = c.rz - fnt.rim;
    }
    return true;
}

function drawItems() {
    const visible = [];
    items.forEach(it => {
        const ok = it.kind === "sprite" ? drawSprite(it)
                 : it.kind === "fence"  ? drawFence(it)
                 : it.kind === "leaf"   ? drawLeaf(it)
                 : it.kind === "basin"  ? drawBasin(it)
                 :                        drawArch(it);
        it.node.style.display = ok ? "" : "none";
        if (ok) visible.push(it);
    });

    // back to front; only touch the DOM when the order actually changes
    visible.sort((p, q) => q.depth - p.depth);
    const order = visible.map(v => items.indexOf(v)).join(",");
    if (order !== lastOrder) {
        visible.forEach(v => el.items.appendChild(v.node));
        lastOrder = order;
    }
}

function drawBackdrop() {
    // hills are infinitely far: they only turn with you
    const pan = ((cam.yaw / 360) * 1800 % 1800 + 1800) % 1800;
    el.hills.setAttribute("transform", `translate(${(-pan).toFixed(2)} -24)`);
    el.sky.setAttribute("transform", `translate(${(260 * Math.sin(cam.yaw * DEG)).toFixed(2)} 0)`);
}

function render() {
    drawBackdrop();
    drawGround();
    drawItems();
    drawCompass();
    drawMinimap();
}


/* ==================== compass and mini map ==================== */

const compassItems = [];

function buildCompass() {
    const track = document.querySelector(".compass .track");
    WORLD.places.forEach(place => {
        const span = document.createElement("span");
        span.className = "place";
        span.textContent = place.label;
        track.appendChild(span);
        compassItems.push({ span, place });
    });
}

function drawCompass() {
    // nearest places first; a label is dropped if it would sit on top of one already shown
    const shown = [];
    compassItems
        .map(({ span, place }) => {
            const dx = place.x - cam.x, dz = place.z - cam.z;
            const bearing = Math.atan2(dx, dz) / DEG;
            const delta = ((bearing - cam.yaw + 180) % 360 + 360) % 360 - 180;
            return { span, delta, away: Math.abs(delta) / 60, dist: Math.hypot(dx, dz) };
        })
        .sort((a, b) => a.dist - b.dist)
        .forEach(c => {
            const left = 50 + (c.delta / 60) * 50;
            const crowded = shown.some(l => Math.abs(l - left) < 19);
            if (c.away > 1 || c.dist < 4 || crowded) { c.span.style.display = "none"; return; }
            shown.push(left);
            c.span.style.display = "";
            c.span.style.left = `${left}%`;
            c.span.style.opacity = (1 - c.away * 0.75).toFixed(2);
            c.span.classList.toggle("here", c.away < 0.2);
        });
}

function buildMinimap() {
    const svg = document.querySelector(".minimap svg");
    const g = make("g", { transform: "scale(1 -1)" });        // north up
    svg.appendChild(g);

    const poly = (pts, attrs) => g.appendChild(make("path", { d: pts.map((p, i) => `${i ? "L" : "M"}${p[0]} ${p[1]}`).join(" ") + " Z", ...attrs }));

    poly(rectPts(-50, -50, 50, 45), { fill: "#2f6b35" });
    // paths and places are read straight from the ground list
    WORLD.ground.forEach(shape => {
        if (!shape.pts || shape.pts[0].length > 2 && shape.pts.every(p => p[2] !== undefined)) return;
        const fill = shape.fill.includes("path") ? "#c8ae86" : shape.fill.includes("asphalt") ? "#3a3f48" : shape.fill.includes("sand") ? "#e2cb9a"
                   : shape.fill.includes("lake") ? "#5aa7d8" : shape.fill.includes("plank") ? "#9a6f43" : null;
        if (fill) poly(shape.pts, { fill });
    });
    poly(rectPts(-50, -50, 50, 45), { fill: "none", stroke: "#8d7353", "stroke-width": 0.8 });
    g.appendChild(make("line", { x1: -2.6, y1: -50, x2: 2.6, y2: -50, stroke: "#2f6b35", "stroke-width": 1.6 }));

    el.mmLamps = {};
    ZONES.forEach(zone => {
        const at = WORLD.lamps[zone.id];
        const dot = make("circle", { cx: at.x, cy: at.z, r: 1.6, fill: "#5f6c84", stroke: "#0b0f1a", "stroke-width": 0.4 });
        g.appendChild(dot);
        el.mmLamps[zone.id] = dot;
    });

    el.mmYou = make("path", { d: "M0 3.2 L-2.2 -2.2 L0 -1 L2.2 -2.2 Z", fill: "#ffd98a", stroke: "#0b0f1a", "stroke-width": 0.5 });
    g.appendChild(el.mmYou);
}

function rectPts(x0, z0, x1, z1) { return [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]; }

function drawMinimap() {
    el.mmYou.setAttribute("transform", `translate(${cam.x.toFixed(2)} ${cam.z.toFixed(2)}) rotate(${(-cam.yaw).toFixed(1)})`);
}

/** Called by park.js so the map shows which lamps are lit. */
export function paintMinimapLamp(zoneId, isOn) {
    el.mmLamps?.[zoneId]?.setAttribute("fill", isOn ? "#ffd479" : "#5f6c84");
}


/* ==================== moving ==================== */

const keys = new Set();
const pad  = { forward: false, back: false, left: false, right: false };

function moveBy(dx, dz) {
    let x = cam.x + dx, z = cam.z + dz;
    const b = WORLD.bounds, g = WORLD.gate;

    if (z < -50) {
        // outside the park: stay on the drive
        x = Math.max(-WORLD.driveHalfWidth, Math.min(WORLD.driveHalfWidth, x));
        z = Math.max(-64, z);
    } else {
        x = Math.max(b.minX, Math.min(b.maxX, x));
        z = Math.min(b.maxZ, z);
    }

    // the gate: shut, it is a wall; open, you pass between the pillars
    const crossing = (cam.z < g.z) !== (z < g.z);
    if (crossing) {
        if (gate < 0.98) z = cam.z;                             // bump into it
        else if (Math.abs(x) > g.halfGap - 0.5) z = cam.z;      // pillars
    }
    if (z >= -50 && z < -49.2 && cam.z >= -49.2) z = cam.z;     // fence line inside

    // the fountain basin is a wall at knee height
    const fnt = WORLD.fountain;
    if (fnt && Math.hypot(x - fnt.cx, z - fnt.cz) < fnt.rim + 0.5) { x = cam.x; z = cam.z; }

    // the lake is wet
    const L = WORLD.lake;
    const ex = (x - L.cx) / (L.rx + 0.6), ez = (z - L.cz) / (L.rz + 0.6);
    if (ex * ex + ez * ez < 1) { x = cam.x; z = cam.z; }

    cam.x = x; cam.z = z;
}

function step(dt) {
    const fwd  = (keys.has("w") || keys.has("arrowup")   || pad.forward) ? 1 : 0;
    const back = (keys.has("s") || keys.has("arrowdown") || pad.back)    ? 1 : 0;
    const left  = (keys.has("arrowleft")  || pad.left)  ? 1 : 0;
    const right = (keys.has("arrowright") || pad.right) ? 1 : 0;
    const strafeL = keys.has("a") ? 1 : 0, strafeR = keys.has("d") ? 1 : 0;

    cam.yaw += (right - left) * TURN_SPEED * dt;

    const move = (fwd - back) * WALK_SPEED * dt;
    const side = (strafeR - strafeL) * WALK_SPEED * 0.8 * dt;
    if (move || side) {
        const s = Math.sin(cam.yaw * DEG), c = Math.cos(cam.yaw * DEG);
        moveBy(s * move + c * side, c * move - s * side);
    }

    // the gate swings once you have clicked to open it
    const g = WORLD.gate;
    if (gateOpening && gate < 1) {
        gate = Math.min(1, gate + dt / 1.6);
        if (gate >= 1) setHintOverride("Walk in with W or ↑. At the fountain, the path goes left to the playground and right to the trail and the lake.");
    }

    // hints as you arrive
    if (!insidePark && cam.z > g.z) {
        insidePark = true;
        setHintOverride(null);
    }
}

let last = performance.now();
function loop(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    step(dt);
    render();
    requestAnimationFrame(loop);
}


/* ==================== input ==================== */

function bindInput() {

    window.addEventListener("keydown", e => {
        if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
        const k = e.key.toLowerCase();
        if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) { keys.add(k); e.preventDefault(); }
    });
    window.addEventListener("keyup", e => keys.delete(e.key.toLowerCase()));
    window.addEventListener("blur", () => keys.clear());

    // on-screen pad: hold to move
    document.querySelectorAll(".pad button").forEach(btn => {
        const dir = btn.dataset.dir;
        const on  = e => { pad[dir] = true;  btn.setPointerCapture?.(e.pointerId); e.preventDefault(); };
        const off = () => { pad[dir] = false; };
        btn.addEventListener("pointerdown", on);
        btn.addEventListener("pointerup", off);
        btn.addEventListener("pointercancel", off);
        btn.addEventListener("pointerleave", off);
    });

    // the first click (or Enter / Space) opens the gate
    const openGate = () => { if (!gateOpening) { gateOpening = true; setHintOverride("The gate is opening…"); } };
    el.stage.addEventListener("pointerdown", () => { if (!gateOpening) openGate(); }, { capture: true });
    window.addEventListener("keydown", e => { if ((e.key === "Enter" || e.key === " ") && !gateOpening) { openGate(); e.preventDefault(); } });

    // drag the scene sideways to look around; a plain click still reaches the lamps
    const svg = el.scene;
    let dragging = false, lastX = 0, moved = 0;
    svg.addEventListener("pointerdown", e => {
        if (e.target.closest?.(".car") || e.target.closest?.(".lamp .hit")) return;
        dragging = true; lastX = e.clientX; moved = 0;
    });
    svg.addEventListener("pointermove", e => {
        if (!dragging) return;
        const dx = e.clientX - lastX; lastX = e.clientX; moved += Math.abs(dx);
        cam.yaw += dx * DRAG_TURN;
    });
    const stop = () => {
        if (dragging && moved > 6) window.addEventListener("click", ev => { ev.stopPropagation(); ev.preventDefault(); }, { capture: true, once: true });
        dragging = false;
    };
    svg.addEventListener("pointerup", stop);
    svg.addEventListener("pointercancel", stop);
    svg.addEventListener("pointerleave", () => { dragging = false; });

    // trackpad: sideways swipe turns, vertical swipe walks
    svg.addEventListener("wheel", e => {
        e.preventDefault();
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) cam.yaw += e.deltaX * 0.08;
        else {
            const s = Math.sin(cam.yaw * DEG), c = Math.cos(cam.yaw * DEG);
            const d = -e.deltaY * 0.01;
            moveBy(s * d, c * d);
        }
    }, { passive: false });
}


/* ==================== boot ==================== */

export function initEngine() {
    el.stage = document.getElementById("stage");
    el.scene = document.getElementById("scene");
    el.ground = document.getElementById("ground");
    el.items  = document.getElementById("items");
    el.hills  = document.getElementById("hillsLayer");
    el.sky    = document.getElementById("skySway");

    buildGround();
    buildSprites();
    buildFences();
    buildBasin();
    buildGate();
    buildCompass();
    buildMinimap();
    bindInput();

    setHintOverride("Click anywhere to open the gate.");

    render();
    requestAnimationFrame(loop);
}
