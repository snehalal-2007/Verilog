/* ==============================================================
   world.js — the park as a map
   --------------------------------------------------------------
   Everything here is in metres, seen from above. x runs east,
   z runs north. The gate is on the south fence at (0, -50) and
   you start on the drive just outside it, facing north.

   engine.js draws all of this in perspective from wherever you
   are standing. Nothing in this file knows about the screen.
   ============================================================== */


/* ---------------- helpers for building ground shapes ---------------- */

/** n points around an ellipse, as [x, z] pairs. */
export function ellipse(cx, cz, rx, rz, n = 28) {
    const pts = [];
    for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        pts.push([cx + Math.cos(a) * rx, cz + Math.sin(a) * rz]);
    }
    return pts;
}

/** A path of constant width following a polyline, as a polygon. */
export function strip(centre, halfWidth) {
    const left = [], right = [];
    for (let i = 0; i < centre.length; i++) {
        const [x, z] = centre[i];
        const [px, pz] = centre[Math.max(0, i - 1)];
        const [nx, nz] = centre[Math.min(centre.length - 1, i + 1)];
        let dx = nx - px, dz = nz - pz;
        const len = Math.hypot(dx, dz) || 1;
        dx /= len; dz /= len;
        // normal to the direction of travel
        left .push([x - dz * halfWidth, z + dx * halfWidth]);
        right.push([x + dz * halfWidth, z - dx * halfWidth]);
    }
    return left.concat(right.reverse());
}

export function rect(x0, z0, x1, z1) {
    return [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
}


/* ---------------- the layout ---------------- */

const GATE = { x: 0, z: -50, halfGap: 2.6, leaf: 2.3, pillarH: 3.4 };
const FOUNTAIN = { cx: 0, cz: -24, rim: 7.5, wall: 0.6, height: 0.6, water: 0.45, plaza: 12 };
const LAKE = { cx: 35, cz: 30, rx: 10.5, rz: 7 };
const DECK = { x0: -6, z0: 25, x1: 10, z1: 32, height: 0.35 };
const PIT  = { cx: -30, cz: -2, rx: 8, rz: 6 };

/* centre lines of the paths. From the gate a short drive runs to a
   T-junction; the cross path sweeps left and right and curls toward
   the back corners, and the fountain plaza opens straight ahead. */
const DRIVE     = [[0, -56], [0, -37]];
const WEST_ARM  = [[0, -38], [-12, -38], [-24, -35], [-32, -27], [-35, -16], [-33, -9]];
const EAST_ARM  = [[0, -38], [12, -38], [24, -35], [32, -27], [35, -16], [35, -8]];
const TO_DECK   = [[0, -12], [0, 4], [1.5, 15], [2, 23]];
const TRAIL     = [[35, -8], [33, 4], [30, 14], [26, 22], [23, 27]];
const TO_PICNIC = [[-30, 5], [-27, 15], [-24, 24]];

export const WORLD = {

    start: { x: 0, z: -58, yaw: 0 },

    /* you can walk anywhere inside the fence; outside it only on the drive */
    bounds: { minX: -49, maxX: 49, minZ: -49.2, maxZ: 44 },
    driveHalfWidth: 1.9,

    gate: GATE,
    fountain: FOUNTAIN,
    lake: LAKE,
    deck: DECK,

    /* landmarks: compass labels */
    places: [
        { id: "fountain",   label: "The Fountain",    x: FOUNTAIN.cx, z: FOUNTAIN.cz },
        { id: "lake",       label: "The Lake",        x: LAKE.cx, z: LAKE.cz },
        { id: "picnic",     label: "Picnic Clearing", x: -24, z: 28 },
        { id: "playground", label: "Playground",      x: PIT.cx, z: PIT.cz },
        { id: "deck",       label: "Stargazing Deck", x: 2,   z: 28 },
        { id: "trail",      label: "Trail",           x: 31,  z: 10 },
        { id: "entrance",   label: "Entrance",        x: 0,   z: -50 }
    ],

    /* where the four lamp posts stand: keys match ZONES in config.js */
    lamps: {
        fountain:   { x: 10,   z: -34 },
        trail:      { x: 32,   z: 8   },
        playground: { x: -22,  z: -9  },
        stargaze:   { x: -8.5, z: 25  }
    },

    /* ---------- ground: flat shapes, drawn in this order ---------- */
    ground: [
        // drive, cross path and the plaza around the fountain
        { fill: "url(#pathGrad)",  filter: "url(#tex-gravel)", pts: strip(DRIVE, 2.2) },
        { fill: "url(#pathGrad)",  filter: "url(#tex-gravel)", pts: strip(WEST_ARM, 1.9) },
        { fill: "url(#pathGrad)",  filter: "url(#tex-gravel)", pts: strip(EAST_ARM, 1.9) },
        { fill: "url(#pathGrad)",  filter: "url(#tex-gravel)", pts: ellipse(FOUNTAIN.cx, FOUNTAIN.cz, FOUNTAIN.plaza, FOUNTAIN.plaza * 0.9, 40) },
        { fill: "#000", opacity: 0.08, pts: strip(DRIVE, 0.25) },

        // paths onward
        { fill: "url(#pathGrad)",  filter: "url(#tex-gravel)", pts: strip(TO_DECK, 1.3) },
        { fill: "url(#pathGrad)",  filter: "url(#tex-gravel)", pts: strip(TRAIL, 1.4) },
        { fill: "url(#pathGrad)",  filter: "url(#tex-gravel)", pts: strip(TO_PICNIC, 1.0) },

        // the fountain's footing and its water; the raised basin wall is
        // drawn by engine.js so it can sit in front of or behind things
        { fill: "#8f8a7c", pts: ellipse(FOUNTAIN.cx, FOUNTAIN.cz, FOUNTAIN.rim + 0.5, FOUNTAIN.rim + 0.5, 40) },
        { fill: "url(#lakeGrad)", y: FOUNTAIN.water, pts: ellipse(FOUNTAIN.cx, FOUNTAIN.cz, FOUNTAIN.rim - FOUNTAIN.wall, FOUNTAIN.rim - FOUNTAIN.wall, 40) },
        { fill: "#fff", opacity: 0.16, y: FOUNTAIN.water + 0.001, pts: ellipse(FOUNTAIN.cx, FOUNTAIN.cz - 1.5, 4.5, 1.6, 20) },

        // sandpit: timber edging then sand
        { fill: "#8a6540", pts: ellipse(PIT.cx, PIT.cz, PIT.rx + 0.6, PIT.rz + 0.6) },
        { fill: "url(#sandGrad)",  filter: "url(#tex-sand)", pts: ellipse(PIT.cx, PIT.cz, PIT.rx, PIT.rz) },

        // lake: muddy bank then water
        { fill: "#6e6a4a", opacity: 0.85, pts: ellipse(LAKE.cx, LAKE.cz, LAKE.rx + 0.8, LAKE.rz + 0.6, 36) },
        { fill: "url(#lakeGrad)",  pts: ellipse(LAKE.cx, LAKE.cz, LAKE.rx, LAKE.rz, 36) },
        { fill: "#fff", opacity: 0.12, pts: ellipse(LAKE.cx, LAKE.cz + 2.5, LAKE.rx * 0.75, 1.8, 24) },

        // jetty planks, raised a little above the water
        { fill: "url(#plankDark)", filter: "url(#tex-wood)", y: 0.3, pts: rect(21, 28.4, 27, 29.8) },

        // deck: fascia (a vertical face), then the planks on top
        { fill: "#4b321c", pts: [[DECK.x0, DECK.z0, 0], [DECK.x1, DECK.z0, 0], [DECK.x1, DECK.z0, DECK.height], [DECK.x0, DECK.z0, DECK.height]] },
        ...[0, 1, 2, 3, 4, 5].map(i => {
            const w = (DECK.z1 - DECK.z0) / 6;
            return { fill: i % 2 ? "url(#plankDark)" : "url(#plankLight)", filter: "url(#tex-wood)", y: DECK.height,
                     pts: rect(DECK.x0, DECK.z0 + i * w, DECK.x1, DECK.z0 + (i + 1) * w) };
        })
    ],

    /* ---------- lines painted on the ground ---------- */
    groundLines: [
        // seams between deck planks
        ...[1, 2, 3, 4, 5].map(i => {
            const w = (DECK.z1 - DECK.z0) / 6;
            return { stroke: "#2e1d0e", opacity: 0.6, width: 0.06, y: DECK.height + 0.001, pts: [[DECK.x0, DECK.z0 + i * w], [DECK.x1, DECK.z0 + i * w]] };
        }),
        // jetty plank seams
        ...[22, 23, 24, 25, 26].map(x => ({ stroke: "#2e1d0e", opacity: 0.5, width: 0.05, y: 0.301, pts: [[x, 28.4], [x, 29.8]] }))
    ],

    /* ---------- fences and railings: posts with rails between ---------- */
    fences: [
        ...fencePerimeter(),
        // deck railing along its back edge
        ...railing([[DECK.x0, DECK.z1], [DECK.x1, DECK.z1]], 4, { base: DECK.height, postH: 1.0, rails: [0.5, 0.95], post: "#5a3e24", rail: "#7d5a37", w: 0.1 }),
        // jetty piles
        ...[[21.2, 28.4], [24, 28.4], [26.8, 28.4], [26.8, 29.8]].map(([x, z]) =>
            ({ a: [x, z], b: [x, z], base: -0.4, postH: 0.7, rails: [], post: "#4a3320", rail: "#4a3320", w: 0.14 }))
    ],

    /* ---------- things that stand up: drawn as sprites facing you ----------
       tpl   id of the template in sprites.html
       u     drawing units per metre, so a sprite's height comes out right
       y     height of its feet above the ground (things on the deck) */
    sprites: [
        // gate pillars
        { tpl: "spr-pillar", x: -GATE.halfGap, z: GATE.z, u: 21 },
        { tpl: "spr-pillar", x:  GATE.halfGap, z: GATE.z, u: 21 },

        // the fountain itself, standing in its basin
        { tpl: "spr-fountain", x: FOUNTAIN.cx, z: FOUNTAIN.cz, u: 30, y: FOUNTAIN.water },

        // playground
        { tpl: "spr-slide",  x: -34.5, z: -5,  u: 37 },
        { tpl: "spr-swing",  x: -27,   z: -2,  u: 33 },
        { tpl: "spr-seesaw", x: -29.5, z: 2.5, u: 38 },

        // deck
        { tpl: "spr-telescope",   x: 6,   z: 29.5, u: 36, y: DECK.height },
        { tpl: "spr-chair-teal",  x: -2,  z: 28.5, u: 40, y: DECK.height },
        { tpl: "spr-chair-cream", x: 1.5, z: 29.8, u: 40, y: DECK.height },

        // trail, lake and picnic clearing
        { tpl: "spr-bench",  x: 29,  z: 16, u: 38 },
        { tpl: "spr-bench",  x: -14, z: -34, u: 38 },
        { tpl: "spr-bench",  x: 14,  z: -34, u: 38 },
        { tpl: "spr-picnic", x: -24, z: 28, u: 40 },
        { tpl: "spr-duck",  x: 34, z: 33, u: 40 },
        { tpl: "spr-duck",  x: 37, z: 29, u: 40 },
        { tpl: "spr-reeds", x: 26, z: 35.5, u: 30 },
        { tpl: "spr-reeds", x: 45, z: 27, u: 30 },
        { tpl: "spr-reeds", x: 40, z: 22.6, u: 30 },

        // trees
        ...[[-44, -44], [-30, -44], [-18, -45], [18, -45], [30, -44], [44, -44], [-44, -30], [44, -30], [-46, -12], [46, -12],
            [-44, 8], [46, 6], [-42, 24], [-46, 38], [-32, 40], [-16, 40], [-4, 42], [14, 40], [26, 42], [44, 40],
            [-14, -22], [14, -22], [-22, 12], [-34, 14], [18, 6], [12, 16], [-12, 14], [40, 10], [20, -26], [-20, -26]]
            .map(([x, z], i) => ({ tpl: "tree-oak", x, z, u: 13 + (i % 3) * 1.5 })),
        ...[[-38, -46], [38, -46], [-47, -22], [47, -22], [-47, 20], [47, 18], [-38, 36], [8, 42], [36, 44], [-26, -36],
            [26, -36], [-8, 20], [8, 8], [24, -14], [-28, 22]]
            .map(([x, z], i) => ({ tpl: "tree-pine", x, z, u: 11 + (i % 3) * 1.2 })),
        ...[[-48, -40], [48, -40], [-48, 0], [48, 0], [-20, 43], [20, 43], [-10, -46], [10, -46], [-36, -14], [36, -22],
            [-12, 30], [16, 30], [-6, -36], [6, -36], [40, 2], [-40, 2]]
            .map(([x, z]) => ({ tpl: "shrub", x, z, u: 22 }))
    ]
};


/* ---------------- fence builders ---------------- */

/** Posts every ~3.2 m along a polyline, rails between neighbours. */
export function railing(points, spacing, style) {
    const out = [];
    for (let s = 0; s < points.length - 1; s++) {
        const [ax, az] = points[s], [bx, bz] = points[s + 1];
        const len = Math.hypot(bx - ax, bz - az);
        const n = Math.max(1, Math.round(len / spacing));
        for (let i = 0; i < n; i++) {
            const t0 = i / n, t1 = (i + 1) / n;
            out.push({
                a: [ax + (bx - ax) * t0, az + (bz - az) * t0],
                b: [ax + (bx - ax) * t1, az + (bz - az) * t1],
                ...style
            });
        }
        // a post at the very end too
        if (s === points.length - 2) out.push({ a: [bx, bz], b: [bx, bz], ...style, rails: [] });
    }
    return out;
}

function fencePerimeter() {
    const style = { base: 0, postH: 1.1, rails: [0.45, 0.85], post: "#7a6246", rail: "#8d7353", w: 0.09 };
    const g = GATE.halfGap + 0.6;
    return [
        ...railing([[ g, -50], [50, -50], [50, 45], [-50, 45], [-50, -50], [-g, -50]], 3.2, style)
    ];
}
