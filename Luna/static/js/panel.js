/* ==============================================================
   panel.js — the status readout and the hint line
   --------------------------------------------------------------
   "Ready to stargaze" is not computed here. It is whatever the
   SystemVerilog last said, and shows "..." while we are waiting
   to hear back.
   ============================================================== */

import { ZONES } from "./config.js";

function setValue(id, text, className) {
    const el = document.getElementById(id);
    el.textContent = text;
    el.className = "val " + className;
}

/**
 * @param {object} state
 * @param {boolean|null} verdict  the hardware's answer, null while in flight
 */
export function updatePanel(state, verdict) {

    ZONES.forEach(zone => {
        const on = state.lamps[zone.id];
        setValue("v-" + zone.id, on ? "ON" : "OFF", on ? "on" : "off");
    });

    setValue("v-sunset", state.night ? "YES" : "NO", state.night ? "yes" : "no");

    if (verdict === null) {
        setValue("v-ready", "...", "waiting");
    } else {
        setValue("v-ready", verdict ? "YES" : "NO", verdict ? "yes" : "no");
    }
}

export function updateHint(state, verdict, trouble) {

    let hint;

    if (trouble) {
        hint = "The simulation could not be reached (" + trouble + ").";
    } else if (!state.night) {
        hint = "Click the sun in the corner to bring on the night.";
    } else if (verdict === true) {
        hint = "The park is dark. Click the moon to bring the day back.";
    } else {
        hint = "Now click each lamp post to switch its lights off.";
    }

    document.getElementById("hint").textContent = hint;
}
