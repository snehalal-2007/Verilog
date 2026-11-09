import { useEffect, useRef, useState } from "react";
import { createGame } from "./game/engine.js";
import { askHardware } from "./api.js";
import Hud from "./components/Hud.jsx";
import Hint from "./components/Hint.jsx";
import Pad from "./components/Pad.jsx";
import { TitleCard, PauseCard, WinCard } from "./components/Cards.jsx";

const START_LAMPS = [
  { id: "a", name: "Fountain", on: false },
  { id: "b", name: "Trail", on: false },
  { id: "c", name: "Playground", on: false },
  { id: "d", name: "Stargazing", on: false },
];

export default function App() {
  const canvasRef = useRef(null);
  const hudRef = useRef(null);
  const gameRef = useRef(null);
  const [snap, setSnap] = useState({ state: "title", overlay: "title", lives: 3, lamps: START_LAMPS, muted: false });

  useEffect(() => {
    const game = createGame({
      canvas: canvasRef.current,
      getHudRect: () => hudRef.current.getBoundingClientRect(),
      onChange: setSnap,
      // Every change to the sun or a lamp goes to the Verilog. Its answer
      // (and only its answer) decides whether the night is won.
      onLamps: (state) => {
        askHardware(state)
          .then((verdict) => { if (verdict) game.setVerdict(verdict); })
          .catch((err) => game.setTrouble(err.message === "Failed to fetch" ? "no connection" : err.message));
      },
    });
    gameRef.current = game;
    if (new URLSearchParams(window.location.search).has("debug")) window.__nox = game;   // test hook
    return () => game.destroy();
  }, []);

  const game = () => gameRef.current;

  return (
    <div className="stage">
      <canvas ref={canvasRef} className="park" aria-label="The playground at night" />
      <Hud ref={hudRef} lamps={snap.lamps} lives={snap.lives} />
      <Hint muted={snap.muted} trouble={snap.trouble} onToggleMute={() => game().setMuted(!snap.muted)} />

      {snap.overlay === "title" && <TitleCard onStart={() => game().start()} />}
      {snap.overlay === "pause" && <PauseCard onResume={() => game().resume()} />}
      {snap.overlay === "win" && <WinCard win={snap.win} onLookUp={() => game().lookUp()} onReplay={() => game().replay()} />}
      {snap.state === "win" && snap.lookingUp && (
        <button className="btn floating-replay" onClick={() => game().replay()}>Play again</button>
      )}

      <Pad onSteer={(d) => game().steer(d)} />
    </div>
  );
}
