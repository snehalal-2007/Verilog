/* On-screen arrows, shown on touch screens only (see styles.css). */
export default function Pad({ onSteer }) {
  const press = (dir) => (e) => { e.preventDefault(); onSteer(dir); };
  return (
    <div className="pad">
      <button className="up" onPointerDown={press("up")} aria-label="Up">▲</button>
      <button className="left" onPointerDown={press("left")} aria-label="Left">◀</button>
      <button className="down" onPointerDown={press("down")} aria-label="Down">▼</button>
      <button className="right" onPointerDown={press("right")} aria-label="Right">▶</button>
    </div>
  );
}
