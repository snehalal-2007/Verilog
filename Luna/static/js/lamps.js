/* ==============================================================
   lamps.js — the four clickable lamp posts
   Each post is drawn from the same template so they stay
   consistent; only position, scale and label differ.
   ============================================================== */

import { ZONES } from "./config.js";

/** One lamp post, bottom-centred on (0, 0) before it is placed. */
function lampMarkup(zone) {

    return `
        <g class="lamp" id="lamp-${zone.id}" data-zone="${zone.id}"
           transform="translate(${zone.x}, ${zone.y}) scale(${zone.scale})">

            <!-- light pooling on the ground -->
            <ellipse class="pool" cx="0" cy="2" rx="96" ry="22" fill="url(#poolGrad)"/>

            <!-- cone of light -->
            <path class="beam" d="M-11 -184 L 11 -184 L 88 2 L -88 2 Z"
                  fill="url(#beamGrad)" filter="url(#soft)"/>

            <!-- post -->
            <ellipse cx="0" cy="3" rx="16" ry="5" fill="#000" opacity="0.35"/>
            <path class="pole" d="M-9 2 L -5 -10 L 5 -10 L 9 2 Z" fill="#2b323d"/>
            <rect class="pole" x="-3.5" y="-186" width="7" height="178" rx="3" fill="url(#poleGrad)"/>

            <!-- lamp head -->
            <path class="pole" d="M-13 -186 L 13 -186 L 8 -202 L -8 -202 Z" fill="#39424f"/>
            <rect class="pole" x="-9" y="-206" width="18" height="6" rx="2" fill="#242b35"/>
            <ellipse class="bulb" cx="0" cy="-184" rx="11" ry="5"/>

            <!-- hot halo around the bulb -->
            <circle class="halo" cx="0" cy="-185" r="34" fill="url(#lampHalo)"/>

            <!-- labels -->
            <text class="tag" x="0" y="30">${zone.label}</text>
            <text class="tag state" x="0" y="48" id="tag-${zone.id}">LIGHTS OFF</text>

            <!-- a click target generous enough to hit the whole post -->
            <rect class="hit" x="-34" y="-212" width="68" height="262"/>
        </g>`;
}

/** Draws the posts and calls onToggle(zoneId) whenever one is clicked. */
export function buildLamps(onToggle) {

    document.getElementById("lamps").innerHTML =
        ZONES.map(lampMarkup).join("");

    ZONES.forEach(zone => {
        document
            .getElementById(`lamp-${zone.id}`)
            .addEventListener("click", () => onToggle(zone.id));
    });
}

/** Reflects one lamp's on/off state in the drawing. */
export function paintLamp(zoneId, isOn) {
    document.getElementById(`lamp-${zoneId}`).classList.toggle("on", isOn);
    document.getElementById(`tag-${zoneId}`).textContent =
        isOn ? "LIGHTS ON" : "LIGHTS OFF";
}
