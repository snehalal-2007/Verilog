/* ==============================================================
   banner.js — "It's time to stargaze"
   The message is a greeting, not a permanent overlay: it appears
   when the last lamp goes out, holds for a moment, then fades so
   the sky is left uncovered.
   ============================================================== */

import { BANNER_HOLD_MS } from "./config.js";

let element = null;
let hideTimer = null;

export function initBanner() {
    element = document.querySelector(".banner");
}

/** Shows the banner and schedules its own exit. */
export function announce() {

    clearTimeout(hideTimer);
    element.classList.add("visible");

    hideTimer = setTimeout(() => {
        element.classList.remove("visible");
    }, BANNER_HOLD_MS);
}

/** Pulls it immediately — used when a lamp comes back on. */
export function dismiss() {
    clearTimeout(hideTimer);
    element.classList.remove("visible");
}
