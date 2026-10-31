/* ==============================================================
   lamps.js — the four clickable lamp posts
   Each post is drawn from the same template so they stay
   consistent; only the label differs. engine.js places them in
   the park (positions in world.js) and scales them with distance.

   The post is a tapered cast-iron column on a stepped plinth,
   carrying a coach lantern: a glass box, wider at the top, with a
   pitched cap and a finial. The glass panes take the warm gradient
   when the lamp is lit (see .lamp.on .glass in scene.css).

   Bottom-centred on (0, 0), 232 units tall, which is 4.2 m at
   55 units per metre.
   ============================================================== */

import { ZONES } from "./config.js";

/** One lamp post, bottom-centred on (0, 0). */
export function lampMarkup(zone) {

    return `
        <g class="lamp" id="lamp-${zone.id}" data-zone="${zone.id}">

            <!-- light pooling on the ground -->
            <ellipse class="pool" cx="0" cy="2" rx="100" ry="23" fill="url(#poolGrad)"/>

            <!-- cone of light -->
            <path class="beam" d="M-12 -190 L 12 -190 L 94 2 L -94 2 Z"
                  fill="url(#beamGrad)" filter="url(#soft)"/>

            <!-- plinth -->
            <ellipse cx="0" cy="3" rx="17" ry="5" fill="#000" opacity="0.4" filter="url(#soft-xs)"/>
            <path class="pole" fill="#1c2129" d="M-12 2 L-12 -3 Q-12 -6 -9 -6 L 9 -6 Q12 -6 12 -3 L12 2 Z"/>
            <path class="pole" fill="url(#poleGrad)" d="M-9 -6 L-8 -14 Q-8 -17 -5 -17 L5 -17 Q8 -17 8 -14 L9 -6 Z"/>
            <rect class="pole" x="-6.5" y="-23" width="13" height="7" rx="2" fill="#262d37"/>

            <!-- tapered column with a decorative collar -->
            <path class="pole" fill="url(#poleGrad)" d="M-4.6 -23 L-2.8 -176 L2.8 -176 L4.6 -23 Z"/>
            <path d="M-1.4 -28 L-0.8 -172" stroke="#fff" stroke-opacity="0.22" stroke-width="1" stroke-linecap="round"/>
            <rect class="pole" x="-5.5" y="-104" width="11" height="5" rx="1.5" fill="#262d37"/>
            <rect class="pole" x="-6" y="-182" width="12" height="7" rx="1.5" fill="#262d37"/>

            <!-- lantern body: glass box, wider at the top -->
            <path class="glass" d="M-11 -186 L-14 -214 L14 -214 L11 -186 Z"/>
            <g class="pole" fill="none" stroke="#1b2029" stroke-width="2" stroke-linejoin="round">
                <path d="M-11 -186 L-14 -214 L14 -214 L11 -186 Z"/>
                <line x1="0" y1="-186" x2="0" y2="-214"/>
            </g>
            <!-- the bulb inside -->
            <ellipse class="bulb" cx="0" cy="-200" rx="4" ry="6.5"/>
            <!-- pitched cap and finial -->
            <path class="pole" fill="#1f252e" d="M-17 -214 L0 -226 L17 -214 Z"/>
            <path class="pole" fill="#3a434f" d="M-17 -214 L0 -226 L0 -214 Z"/>
            <rect class="pole" x="-3" y="-230" width="6" height="5" rx="1" fill="#262d37"/>
            <circle class="pole" cx="0" cy="-232" r="2.6" fill="#3a434f"/>

            <!-- hot halo around the lantern -->
            <circle class="halo" cx="0" cy="-200" r="40" fill="url(#lampHalo)"/>

            <!-- label: the zone name; on/off state shows in the panel -->
            <text class="tag" x="0" y="30">${zone.label}</text>

            <!-- a click target generous enough to hit the whole post -->
            <rect class="hit" x="-34" y="-238" width="68" height="290"/>
        </g>`;
}

/** Wires up clicks once engine.js has placed the posts. */
export function buildLamps(onToggle) {
    ZONES.forEach(zone => {
        document
            .getElementById(`lamp-${zone.id}`)
            .addEventListener("click", () => onToggle(zone.id));
    });
}

/** Reflects one lamp's on/off state in the drawing. */
export function paintLamp(zoneId, isOn) {
    document.getElementById(`lamp-${zoneId}`).classList.toggle("on", isOn);
}
