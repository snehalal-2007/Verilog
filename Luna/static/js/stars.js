/* ==============================================================
   stars.js — procedural star field
   Drawn once at boot; the theme decides whether it is visible.
   ============================================================== */

import { NIGHT_STARS, DEEP_STARS } from "./config.js";

const SVG_NS = "http://www.w3.org/2000/svg";

const HORIZON     = 410;   // stars never sit below the hills
const DEEP_BOTTOM = 430;

function star(maxY, maxRadius, colour) {

    const s = document.createElementNS(SVG_NS, "circle");

    s.setAttribute("cx", (Math.random() * 1200).toFixed(1));
    s.setAttribute("cy", (Math.random() * maxY).toFixed(1));
    s.setAttribute("r",  (Math.random() * maxRadius + 0.3).toFixed(2));
    s.setAttribute("fill", colour);
    s.setAttribute("class", "star");

    // staggering the twinkle keeps the sky from pulsing in unison
    s.style.animationDelay = (Math.random() * 4).toFixed(2) + "s";

    return s;
}

export function buildStars() {

    const plain = document.getElementById("stars");
    const deep  = document.getElementById("deepStars");

    for (let i = 0; i < NIGHT_STARS; i++) {
        plain.appendChild(star(HORIZON, 1.5, "#ffffff"));
    }

    for (let i = 0; i < DEEP_STARS; i++) {
        // a few cool-tinted stars stop the galaxy reading as flat white
        const colour = Math.random() > 0.8 ? "#bcd2ff" : "#ffffff";
        deep.appendChild(star(DEEP_BOTTOM, 1.1, colour));
    }
}
