/* ==============================================================
   config.js — the things you are most likely to want to change
   ============================================================== */

/**
 * The four zones mirror the outputs of stargazing_controller.v
 * (parking_light, trail_light, playground_light,
 *  stargazing_area_light), so wiring the Verilog in later is just
 * a matter of feeding these same four flags.
 *
 * x / y  where the lamp post stands, in SVG viewBox coordinates
 * scale  posts nearer the front of the park are drawn larger
 */
export const ZONES = [
    { id: "parking",    label: "PARKING LOT",     x: 556,  y: 496, scale: 0.78 },
    { id: "trail",      label: "TRAIL",           x: 1152, y: 470, scale: 0.74 },
    { id: "playground", label: "PLAYGROUND",      x: 166,  y: 616, scale: 1.00 },
    { id: "stargaze",   label: "STARGAZING AREA", x: 724,  y: 626, scale: 1.00 }
];

/** How long the "It's time to stargaze" banner stays up before it
 *  fades out and leaves you with an uninterrupted sky. */
export const BANNER_HOLD_MS = 3200;

/** Where Python hands the park's state to the SystemVerilog. */
export const SIMULATE_URL = "/simulate";

/** Star counts: the plain night sky, and the denser field that
 *  only comes out inside the galaxy layer. */
export const NIGHT_STARS = 170;
export const DEEP_STARS  = 240;
