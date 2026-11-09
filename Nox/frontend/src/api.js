/* ================================================================
   api.js — asks the hardware whether it is time to stargaze.

   POST /simulate sends the park's state to Flask (app.py), which runs
   stargazing_controller.v with Icarus Verilog and returns its answer.
   Lamps can change faster than the round trip, so every request is
   numbered and an answer that arrives after a newer one is ignored.
   ================================================================ */

let latest = 0;

/**
 * @param {{sunset:number,a:number,b:number,c:number,d:number}} state  1 = sun down / lamp lit
 * @returns {Promise<{ready:boolean, raw:string} | null>}  null = a newer request superseded this one
 */
export async function askHardware(state) {
  const ticket = ++latest;
  const response = await fetch("/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(state),
  });
  const data = await response.json().catch(() => ({}));
  if (ticket !== latest) return null;
  if (!response.ok) throw new Error(data.error || "the simulation refused the request");
  return { ready: data.ready === 1, raw: data.raw };
}
