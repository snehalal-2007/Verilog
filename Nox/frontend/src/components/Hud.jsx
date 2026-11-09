import { forwardRef } from "react";
import OwlIcon from "./OwlIcon.jsx";

/* Floating in the top-right corner: the four lights, then one owl per life. */
const Hud = forwardRef(function Hud({ lamps, lives, hidden }, ref) {
  return (
    <div className={"hud" + (hidden ? " is-hidden" : "")} ref={ref} aria-hidden={hidden || undefined}>
      <div className="lamps" aria-label="Lights">
        {lamps.map((l) => (
          <div key={l.id} className={"chip" + (l.on ? " on" : "")}>
            <span className="bulb" />
            <span className="name">{l.name}</span>
          </div>
        ))}
      </div>
      <div className="lives" aria-label={`${lives} lives`}>
        {Array.from({ length: Math.max(0, lives) }, (_, i) => <OwlIcon key={i} />)}
      </div>
    </div>
  );
});
export default Hud;
