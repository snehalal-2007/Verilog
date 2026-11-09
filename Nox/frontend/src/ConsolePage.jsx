import { useEffect, useRef, useState } from "react";
import { circ, drawOwl, rng } from "./game/art.js";
import "./console.css";

/* ================================================================
   /verilog — every Verilog run, live (a console-style page).
   Polls GET /runs every half second; each run is one block, the same
   as the terminal printout from app.py.
   ================================================================ */

const POLL_MS = 500;

export default function ConsolePage() {
  const [runs, setRuns] = useState([]);
  const [online, setOnline] = useState(true);
  const lastId = useRef(0);
  const screenRef = useRef(null);
  const stickToBottom = useRef(true);

  useEffect(() => {
    document.body.classList.add("console-body");
    document.title = "Verilog console";
    return () => document.body.classList.remove("console-body");
  }, []);

  useEffect(() => {
    let stopped = false, timer = 0;
    const poll = async () => {
      try {
        const res = await fetch(`/runs?after=${lastId.current}`);
        const data = await res.json();
        if (stopped) return;
        if (data.last < lastId.current) {            // the server restarted: start over
          lastId.current = 0; setRuns([]);
        } else if (data.runs.length) {
          lastId.current = data.runs[data.runs.length - 1].id;
          setRuns((old) => [...old, ...data.runs].slice(-500));
        }
        setOnline(true);
      } catch {
        if (!stopped) setOnline(false);
      }
      if (!stopped) timer = setTimeout(poll, POLL_MS);
    };
    poll();
    return () => { stopped = true; clearTimeout(timer); };
  }, []);

  // follow new lines, unless you've scrolled up to read something
  useEffect(() => {
    const el = screenRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [runs]);
  const onScroll = () => {
    const el = screenRef.current;
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  };

  const latest = runs[runs.length - 1];

  return (
    <div className="console-page">
      <NightSky />
      <div className="console-window">
        <div className="console-bar">
          <span className={"live-pill" + (online ? " on" : "")}>{online ? "live" : "offline"}</span>
          <span className="buttons" aria-hidden="true">
            <button tabIndex={-1} className="red" /><button tabIndex={-1} className="yellow" /><button tabIndex={-1} className="green" />
          </span>
        </div>

        <div className="console-screen-wrap">
          <div className="console-screen" ref={screenRef} onScroll={onScroll} aria-live="polite">
            {runs.length === 0 && (
              <p className="dim">Waiting for the first Verilog run… start a night in the game.</p>
            )}
            {runs.map((r) => <Run key={r.id} run={r} />)}
            {!online && <p className="err">Can't reach the server. Is app.py running?</p>}
            <p className="prompt">&gt; <span className="cursor" /></p>
          </div>
          <OwlCorner happy={!!latest?.ready} />
        </div>
      </div>
    </div>
  );
}

/* The page background: the same night sky as the game's stargazing ending —
   galaxy band, twinkling stars, now and then a shooting star. */
function NightSky() {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current, g = cv.getContext("2d");
    let W = 0, H = 0, stars = [], galaxy = [], id = 0;
    const build = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      W = window.innerWidth; H = window.innerHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const r = rng(42), n = Math.round(W * H / 4500);
      stars = Array.from({ length: n }, () => ({ x: r() * W, y: r() * H, r: .4 + r() * 1.5, ph: r() * Math.PI * 2 }));
      galaxy = Array.from({ length: n * 3 }, () => {
        const t = r(), off = (r() + r() + r() - 1.5) * Math.min(W, H) * .12;
        return { x: t * W + off * .45, y: H * .92 - t * H * .85 + off, r: .3 + r() * 1, c: ["#ffffff", "#d9ccff", "#bfe3ff", "#ffd9f2"][Math.floor(r() * 4)] };
      });
    };
    const draw = (now) => {
      const t = now / 1000;
      const sky = g.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, "#090c2b"); sky.addColorStop(.6, "#1d1a52"); sky.addColorStop(1, "#3a2466");
      g.fillStyle = sky; g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = "lighter";
      for (let i = 0; i <= 14; i++) {
        const k = i / 14, x = k * W, y = H * .92 - k * H * .85, rad = Math.min(W, H) * .22;
        const glow = g.createRadialGradient(x, y, 0, x, y, rad);
        glow.addColorStop(0, "rgba(150,120,255,.09)"); glow.addColorStop(1, "rgba(150,120,255,0)");
        g.fillStyle = glow; circ(g, x, y, rad); g.fill();
      }
      for (const s of galaxy) { g.fillStyle = s.c; circ(g, s.x, s.y, s.r); g.fill(); }
      g.globalCompositeOperation = "source-over";
      for (const s of stars) {
        g.globalAlpha = .35 + (Math.sin(t * 2 + s.ph) * .5 + .5) * .65;
        g.fillStyle = "#fff"; circ(g, s.x, s.y, s.r); g.fill();
      }
      g.globalAlpha = 1;
      // a shooting star every few seconds
      const p = (t % 4.5) / 1;
      if (p < 1) {
        const sx = W * .8 - p * W * .3, sy = H * .06 + p * H * .22;
        const tail = g.createLinearGradient(sx, sy, sx + 110, sy - 48);
        tail.addColorStop(0, "rgba(255,255,255,.95)"); tail.addColorStop(1, "rgba(255,255,255,0)");
        g.strokeStyle = tail; g.lineWidth = 3; g.lineCap = "round";
        g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + 110, sy - 48); g.stroke();
      }
      id = requestAnimationFrame(draw);
    };
    build();
    window.addEventListener("resize", build);
    id = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(id); window.removeEventListener("resize", build); };
  }, []);
  return <canvas className="night-sky" ref={ref} aria-hidden="true" />;
}

function Run({ run }) {
  return (
    <div className="run">
      <div>
        <span className="tag">[verilog run #{run.id}]</span>
        <span className="time">{run.time}</span>
        <span className="cmd">{run.command}</span>
      </div>
      <div className="indent">
        <span className="dim">sun {run.sunset ? "down" : "up"} |</span>
        {run.lamps.map((l) => (
          <span key={l.name} className={"lamp" + (l.on ? " on" : "")}>{l.name} {l.on ? "ON" : "off"}</span>
        ))}
      </div>
      <div className="indent result">{run.raw}</div>
      <div className={"indent verdict" + (run.ready ? " yes" : "")}>
        {run.ready ? "READY = 1  → time to stargaze! ★" : "READY = 0  → not yet"}
      </div>
    </div>
  );
}

/* Nox in the bottom-right corner: watches the logs, looks up when READY = 1. */
function OwlCorner({ happy }) {
  const ref = useRef(null);
  const happyRef = useRef(happy);
  happyRef.current = happy;
  useEffect(() => {
    const g = ref.current.getContext("2d");
    const t0 = performance.now();
    let id = 0;
    const draw = (now) => {
      const t = (now - t0) / 1000, up = happyRef.current;
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, 240, 240);
      if (up) {
        const glow = g.createRadialGradient(120, 130, 10, 120, 130, 110);
        glow.addColorStop(0, "rgba(255,224,102,.45)"); glow.addColorStop(1, "rgba(255,224,102,0)");
        g.fillStyle = glow; circ(g, 120, 130, 110); g.fill();
      }
      const look = up ? { x: .2, y: -1 } : { x: -0.9, y: .25 + Math.sin(t * .7) * .25 };
      drawOwl(g, 120, 138 + Math.sin(t * 2.4) * 4, 4, { t: t + 1, look, still: !up });
      id = requestAnimationFrame(draw);
    };
    id = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(id);
  }, []);
  return <canvas className="console-owl" ref={ref} width="240" height="240" aria-hidden="true" />;
}
