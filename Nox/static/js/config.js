/* ==============================================================
   config.js — the things you are most likely to want to change
   (where things stand in the park is in world.js)
   ============================================================== */

/**
 * The four zones mirror the inputs of stargazing_controller.v
 * (a = fountain, b = trail, c = playground, d = stargazing area).
 * Each has a lamp post; world.js says where it stands.
 */
export const ZONES = [
    { id: "fountain",   label: "THE FOUNTAIN"    },
    { id: "trail",      label: "TRAIL"           },
    { id: "playground", label: "PLAYGROUND"      },
    { id: "stargaze",   label: "STARGAZING AREA" }
];

/** How long the "It's time to stargaze" banner stays up before it
 *  fades out and leaves you with an uninterrupted sky. */
export const BANNER_HOLD_MS = 3200;

/** Where Python hands the park's state to the SystemVerilog. */
export const SIMULATE_URL = "/simulate";

/** Star counts: the plain night sky, and the denser field that
 *  only comes out inside the galaxy layer. */
export const NIGHT_STARS = 260;
export const DEEP_STARS  = 360;
