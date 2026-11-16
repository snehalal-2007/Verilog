# Nox — Stargazing Park

A small web game that asks a piece of simulated hardware one question: *is it time to stargaze?*

Nox the owl wants to see the stars, but the park lamps are too bright. You fly Nox around the park at night and switch off the four lamps: fountain, trail, playground and stargazing area. Every time the sun or a lamp changes, the park's state is handed to a Verilog module, simulated with Icarus Verilog, and the hardware's verdict comes back to the game. The night is won only when the Verilog answers `READY=1`.

The decision rule lives **only** in `stargazing_controller.v`:

```
ready = sunset & ~a & ~b & ~c & ~d
```

Python (`app.py`) carries bits back and forth and the game draws the answer. Neither of them decides anything.

- [VERILOG.md](VERILOG.md) explains the Verilog itself: the module, the testbench, the truth table and how a lamp click becomes a simulation run.
- [TECH_STACK.md](TECH_STACK.md) breaks down the languages and tools. Its interface section describes the classic park at `/classic`, not the React game.

## How the pieces connect

```
React game (frontend/)          POST /simulate  {sunset, a, b, c, d}
        │
        ▼
Flask (app.py)                  vvp simulation +SUNSET=1 +A=0 +B=0 +C=0 +D=0
        │
        ▼
Verilog (stargazing_controller.v)   RESULT SUNSET=1 A=0 B=0 C=0 D=0 READY=1
```

## Prerequisites

- **Python 3** with Flask
- **Icarus Verilog** (`iverilog` and `vvp` must be on your `PATH`)
- **Node.js** with npm, to build the game

On macOS with Homebrew:

```sh
brew install icarus-verilog node
pip install flask
```

## Run it

Build the game once, and again after changing anything in `frontend/`:

```sh
cd Nox/frontend
npm install
npm run build
```

Start the server:

```sh
cd Nox
python3 app.py
```

Then open <http://localhost:5050>.

The server uses port 5050 because macOS Control Center (AirPlay Receiver) occupies 5000. If 5050 is busy too, pick another:

```sh
PORT=5077 python3 app.py
```

On the first request, or whenever `stargazing_controller.v` is newer than `simulation`, the server recompiles the Verilog before running it. You do not need to compile by hand.

## Pages

| Address | What it is |
|---------|------------|
| `/` | The game, *Nox's Night Out* |
| `/verilog` | Live console of every Verilog run. Open it in a second window while you play |
| `/classic` | The original realistic park you walk through |

The `/verilog` page shows each run within half a second: the `vvp` command, which lamps were on, the simulator's `RESULT` line and the `READY` verdict. The same runs are printed in the terminal running `app.py`.

## Playing

| Control | What it does |
|---------|--------------|
| **Space** | In the park, makes it night and starts the game. While flying, stops Nox to hover |
| **↑ ↓ ← →** or **W A S D** | Steer Nox. On a touch screen, use the pad |
| **Space** twice, **P** or **Esc** | Pause |

- Fly into a lit lamp to switch it off.
- Each lost owlet you pick up is an extra life. They follow Nox in a line.
- A bump costs a life. You start with 3. Lose them all and the game starts over.
- When all four lamps are dark and the Verilog says `READY=1`, the stars come out.

If the game can't reach the server, it says so and the night can't be won. It fails closed.

## What's in here

| Path | Purpose |
|------|---------|
| `stargazing_controller.v` | The `Breadboard` module (the logic) and a `testbench` that drives it |
| `app.py` | Flask server. Serves the pages, runs the simulation, returns the result as JSON |
| `simulation` | Compiled output from `iverilog`. Rebuilt automatically when the `.v` file changes |
| `frontend/` | The React game, built with Vite into `frontend/dist` |
| `frontend/src/game/engine.js` | The canvas game: park layout, Nox, owlets, lamps. Has no stargazing rule; it reports lamps and waits for the verdict |
| `frontend/src/game/art.js` | Drawing helpers and the characters |
| `frontend/src/api.js` | `POST /simulate`, ignoring answers that arrive after a newer request |
| `frontend/src/App.jsx` and `components/` | Floating lights and lives, controls, title and pause cards |
| `frontend/src/ConsolePage.jsx` | The `/verilog` console page |
| `templates/` and `static/` | HTML, CSS and JavaScript for the classic park at `/classic` |
| `prototypes/` | Early single-file draft of the owl game |
| `VERILOG.md` | How the Verilog works |
| `TECH_STACK.md` | What each layer is built with and why |

## Working on the game

`npm run dev` in `frontend/` serves the game with live reload on <http://localhost:5173> and forwards `/simulate` to Flask on port 5050, so keep `python3 app.py` running too.

## API

`POST /simulate` with a JSON body such as:

```json
{"sunset": 1, "a": 0, "b": 0, "c": 0, "d": 0}
```

Returns the echoed inputs, the `ready` verdict and the raw `RESULT` line from the simulator. Values other than 0 or 1 are rejected with a 400. If the Verilog fails to compile or its output can't be read, the answer is a 500 with the tool's output.

`GET /runs?after=<id>` returns the Verilog runs newer than that id. The `/verilog` page polls it.

## The classic park

The first version of Nox is kept at <http://localhost:5050/classic>. It is a park laid out as a map in metres and drawn in perspective from where you stand. Click (or press Enter) to open the gate, walk with **W / S** or **↑ / ↓**, turn with **← / →**, sidestep with **A / D**. Click the sun to bring on the night, then walk to each lamp post and click it to switch it off. It asks the same Verilog the same question.
