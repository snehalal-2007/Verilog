import { useEffect, useRef } from "react";
import { circ, drawOwl } from "../game/art.js";

/* Nox, bobbing and looking around, on the title card. */
export default function Mascot() {
  const ref = useRef(null);
  useEffect(() => {
    const g = ref.current.getContext("2d");
    let id = 0;
    const t0 = performance.now();
    const draw = (now) => {
      const t = (now - t0) / 1000;
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, 240, 240);
      const glow = g.createRadialGradient(120, 120, 10, 120, 120, 110);
      glow.addColorStop(0, "rgba(255,224,102,.55)");
      glow.addColorStop(1, "rgba(255,224,102,0)");
      g.fillStyle = glow; circ(g, 120, 120, 110); g.fill();
      drawOwl(g, 120, 128 + Math.sin(t * 3) * 5, 4.2, { t: t + 1, look: { x: Math.sin(t * .9), y: Math.cos(t * .6) * .4 } });
      id = requestAnimationFrame(draw);
    };
    id = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(id);
  }, []);
  return <canvas className="mascot" ref={ref} width="240" height="240" aria-hidden="true" />;
}
