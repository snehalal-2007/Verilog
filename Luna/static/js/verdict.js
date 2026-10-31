/* ==============================================================
   verdict.js — asks the hardware whether it is time to stargaze
   --------------------------------------------------------------
   This file does not know the rule, and neither does any other
   file in static/js. It reports the state of the park to Python,
   which runs stargazing_controller.v, and waits to be told.
   ============================================================== */

import { SIMULATE_URL } from "./config.js";

/* Clicks can outpace the round trip, so every request is numbered
   and any answer that arrives after a newer one is thrown away. */
let latest = 0;

/**
 * Sends the park's state to the simulation.
 *
 * @param {object} state        {night, lamps:{parking,trail,playground,stargaze}}
 * @param {function} onVerdict  called with {ready, raw} when the hardware answers
 * @param {function} onTrouble  called with a message if it cannot be reached
 */
export async function askHardware(state, onVerdict, onTrouble) {

    const ticket = ++latest;

    // a, b, c, d are the four lamps (fountain, trail, playground,
    // stargazing area); 1 = lit. The hardware names them this way, so
    // the wire format does too.
    const payload = {
        sunset: state.night ? 1 : 0,
        a: state.lamps.fountain   ? 1 : 0,
        b: state.lamps.trail      ? 1 : 0,
        c: state.lamps.playground ? 1 : 0,
        d: state.lamps.stargaze   ? 1 : 0
    };

    try {
        const response = await fetch(SIMULATE_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (ticket !== latest) return;          // a newer click won

        if (!response.ok) {
            onTrouble(data.error || "the simulation refused the request");
            return;
        }

        onVerdict({ ready: data.ready === 1, raw: data.raw });

    } catch (problem) {
        if (ticket !== latest) return;
        onTrouble("cannot reach the simulator");
    }
}
