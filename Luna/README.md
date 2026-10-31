# Luna — Stargazing Park

A small web app that asks a piece of simulated hardware one question: *is it time to stargaze?*

You walk through a park. It is laid out as a map in metres and drawn in perspective from wherever you are standing. You arrive at an iron gate; beyond it a short path leads to a junction with a stone fountain straight ahead. The path sweeps left to the playground and right along a woodland trail to a lake with a jetty. Behind the fountain is the stargazing deck, and a picnic clearing sits in the north-west corner. Four places have a lamp post: the fountain, the trail, the playground and the deck. Every time you flip the sun or a lamp, the park's state is handed to a Verilog module, simulated with Icarus Verilog, and the hardware's verdict is drawn back onto the scene.

**Controls**

- Click anywhere (or press Enter) to open the gate, then walk in with **W** or **↑**.
- **W / S** or **↑ / ↓** walk forward and back. **← / →** turn. **A / D** sidestep. Drag the scene sideways to look around. On a touch screen, hold the pad in the corner.
- The mini map shows the park from above with you on it. The strip at the top names what is ahead of you.
- Click the sun to bring on the night. Click the moon to bring the day back.
- At night, walk to a lamp post and click it to switch it off. When all four are dark, the galaxy comes out.

The decision rule lives **only** in `stargazing_controller.v`:

```
ready = sunset & ~a & ~b & ~c & ~d
```

Python (`app.py`) just carries bits back and forth. It does not decide anything.

For a full breakdown of every language, library and tool in the project, see [TECH_STACK.md](TECH_STACK.md).

## What's in here

| Path | Purpose |
|------|---------|
| `stargazing_controller.v` | The `Breadboard` module (the logic) and a `testbench` that drives it |
| `app.py` | Flask server. Serves the page, runs the simulation, returns the result as JSON |
| `simulation` | Compiled output from `iverilog`. Rebuilt automatically when the `.v` file changes |
| `templates/` | The HTML scene: sky, hills, sprite templates for everything that stands up, and the interface overlays |
| `static/` | CSS and JavaScript for the interactive park |
| `TECH_STACK.md` | What each layer is built with and why |

## Prerequisites

- **Python 3** with Flask
- **Icarus Verilog** (`iverilog` and `vvp` must be on your `PATH`)

On macOS with Homebrew:

```sh
brew install icarus-verilog
pip install flask
```

## Run the web app

```sh
cd Luna
python3 app.py
```

Then open <http://localhost:5050> in a browser.

The server runs on port 5050 rather than 5000 because macOS Control Center (AirPlay Receiver) occupies 5000. If 5050 is also busy on your machine, pick another:

```sh
PORT=5077 python3 app.py
```

The page loads three typefaces from Google Fonts. Without internet it falls back to system fonts and everything still works.

On the first request, or whenever `stargazing_controller.v` is newer than `simulation`, the server recompiles the Verilog before running it. You do not need to compile by hand to use the app.

## Run the Verilog by itself

You can exercise the hardware without the web app.

Compile:

```sh
iverilog -o simulation stargazing_controller.v
```

Print the full 32-row truth table:

```sh
vvp simulation
```

Ask about one specific state of the park. Each switch is `1` (lit) or `0` (dark). Any switch you leave out counts as `0`:

```sh
vvp simulation +SUNSET=1 +A=0 +B=0 +C=0 +D=0
```

Output:

```
RESULT SUNSET=1 A=0 B=0 C=0 D=0 READY=1
```

This single-line form is exactly what `app.py` calls and parses.

## Inputs

| Plusarg | Meaning |
|---------|---------|
| `SUNSET` | 1 after sunset, 0 during the day |
| `A` | Fountain lamp |
| `B` | Trail lamp |
| `C` | Playground lamp |
| `D` | Stargazing area lamp |

`READY` is 1 only when the sun has set and all four lamps are dark.

## API

`POST /simulate` with a JSON body such as:

```json
{"sunset": 1, "a": 0, "b": 0, "c": 0, "d": 0}
```

Returns the echoed inputs, the `ready` verdict, and the raw `RESULT` line from the simulator. Values other than 0 or 1 are rejected with a 400.
