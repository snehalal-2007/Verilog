/* ==============================================================
   park.js — what the park is doing
   --------------------------------------------------------------
   This file tracks which switches you have flipped and paints the
   result. It deliberately does NOT know when it is time to
   stargaze: that rule lives in stargazing_controller.v, is asked
   for over /simulate, and arrives back through verdict.js.

   So a click happens in two stages:

     1. paint()    immediate, local, presentation only
     2. the answer from the hardware, whenever it lands

   Only stage 2 may reveal the galaxy.
   ============================================================== */

import { ZONES } from "./config.js";
import { paintLamp } from "./lamps.js";
import { updatePanel, updateHint } from "./panel.js";
import { announce, dismiss } from "./banner.js";
import { askHardware } from "./verdict.js";

const state = {
    night: false,
    lamps: { parking: false, trail: false, playground: false, stargaze: false }
};

/* The hardware's last word. null means "we have not been told yet". */
let verdict = null;
let trouble = null;

/* So the banner only fires on the transition into stargazing. */
let wasReady = false;


/* ---------------- actions ---------------- */

export function toggleSun() {

    state.night = !state.night;

    // Sunset switches every lamp in the park on; sunrise clears them.
    // This is stagecraft, not the stargazing rule.
    ZONES.forEach(zone => { state.lamps[zone.id] = state.night; });

    update();
}

export function toggleLamp(zoneId) {

    // During the day the lamps are simply not in play.
    if (!state.night) return;

    state.lamps[zoneId] = !state.lamps[zoneId];
    update();
}

export function reset() {
    state.night = false;
    ZONES.forEach(zone => { state.lamps[zone.id] = false; });
    update();
}


/* ---------------- the two stages ---------------- */

function update() {
    verdict = null;            // the previous answer is now out of date
    trouble = null;
    paint();
    askHardware(state, onVerdict, onTrouble);
}

/** Everything that can be drawn without knowing the hardware's answer. */
function paint() {

    const ready = verdict === true;

    document.body.className =
        ready ? "night stargaze" : (state.night ? "night" : "day");

    ZONES.forEach(zone => paintLamp(zone.id, state.lamps[zone.id]));

    updatePanel(state, verdict);
    updateHint(state, verdict, trouble);

    if (ready && !wasReady)      announce();
    else if (!ready && wasReady) dismiss();

    wasReady = ready;
}

function onVerdict(answer) {
    verdict = answer.ready;
    trouble = null;
    paint();
}

function onTrouble(message) {
    // Fail closed: no galaxy unless the hardware actually said so.
    verdict = false;
    trouble = message;
    paint();
}


/* ---------------- boot ---------------- */

export function start() {
    update();
}
