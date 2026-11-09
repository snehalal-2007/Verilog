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
    document.body.style.backgroundImage = `url(${pixelTile()})`;
    return () => { document.body.classList.remove("console-body"); document.body.style.backgroundImage = ""; };
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

/* A 32 x 32 tile of black and dark-grey pixels (fixed seed, so it is the
   same every time). CSS scales it up with image-rendering: pixelated. */
function pixelTile() {
  const c = document.createElement("canvas");
  c.width = c.height = 32;
  const g = c.getContext("2d"), r = rng(5);
  const greys = ["#111111", "#161616", "#1b1b1b", "#202020", "#262626", "#2d2d2d", "#353535", "#3e3e3e"];
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
    const k = r();
    g.fillStyle = greys[Math.floor(k * k * greys.length)];     // mostly dark, a few lighter pixels
    g.fillRect(x, y, 1, 1);
  }
  return c.toDataURL();
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
