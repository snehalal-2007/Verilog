/* Floating in the bottom-left corner. */
export default function Hint({ muted, onToggleMute, trouble }) {
  return (
    <div className="hint">
      {trouble && <span className="trouble">Can't reach the hardware ({trouble}). Is app.py running?</span>}
      <span><kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> steer</span>
      <span><kbd>Space</kbd> stop</span>
      <span><kbd>Space</kbd>×2 pause</span>
      <button className="pill btnpill" onClick={onToggleMute}>{muted ? "Sound off" : "Sound on"}</button>
    </div>
  );
}
