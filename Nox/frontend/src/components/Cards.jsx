import Mascot from "./Mascot.jsx";

export function TitleCard({ onStart }) {
  return (
    <div className="overlay">
      <div className="card">
        <Mascot />
        <h2>Meet Nox</h2>
        <p>Nox wants to see the stars tonight, but the park lamps are far too bright. When night falls, fly to each lamp to switch it off.</p>
        <div className="how">
          <span><kbd>Space</kbd></span><span>In the park, press Space to make it night and start</span>
          <span><kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd></span><span>Steer Nox</span>
          <span>Lamps</span><span>Fly into a lit lamp to switch it off</span>
          <span>Owlets</span><span>Each lost owlet you pick up is an extra life. They follow Nox in a line</span>
          <span><kbd>Space</kbd></span><span>Stop and hover. Tap <kbd>Space</kbd> twice quickly to pause</span>
          <span>Bumps</span><span>A bump costs a life, but Nox stays put. You start with 3. Lose them all and the game starts over</span>
        </div>
        <div><button className="btn" onClick={onStart}>Let's go</button></div>
      </div>
    </div>
  );
}

export function PauseCard({ onResume }) {
  return (
    <div className="overlay">
      <div className="card">
        <h2>Paused</h2>
        <p>Nox is hovering patiently.</p>
        <button className="btn" onClick={onResume}>Keep flying</button>
      </div>
    </div>
  );
}
