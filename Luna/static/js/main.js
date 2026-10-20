/* ==============================================================
   main.js — boot
   ============================================================== */

import { buildStars } from "./stars.js";
import { buildLamps } from "./lamps.js";
import { initBanner } from "./banner.js";
import { initInteractions } from "./interact.js";
import { toggleSun, toggleLamp, reset, start } from "./park.js";

buildStars();
buildLamps(toggleLamp);
initBanner();
initInteractions();

document.getElementById("celestial").addEventListener("click", toggleSun);
document.getElementById("reset").addEventListener("click", reset);

// Asks the hardware about the opening state before anything is clicked.
start();
