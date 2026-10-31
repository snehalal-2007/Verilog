/* ==============================================================
   main.js — boot
   ============================================================== */

import { buildStars } from "./stars.js";
import { buildLamps } from "./lamps.js";
import { initBanner } from "./banner.js";
import { initInteractions } from "./interact.js";
import { initEngine } from "./engine.js";
import { toggleSun, toggleLamp, reset, start } from "./park.js";

buildStars();
initEngine();               // builds the park, including the lamp posts
buildLamps(toggleLamp);     // then the posts can be clicked
initBanner();
initInteractions();

document.getElementById("celestial").addEventListener("click", toggleSun);
document.getElementById("reset").addEventListener("click", reset);

// Asks the hardware about the opening state before anything is clicked.
start();
