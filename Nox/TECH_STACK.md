# Nox — What It's Built With

Nox is three layers stacked on top of each other. Each one has a single job, and the
decision about when to stargaze is made in exactly one place: the hardware.

```
┌─────────────────────────────────────────────────────────────┐
│  Browser  ·  HTML + CSS + SVG + JavaScript                   │
│  Draws the park, takes clicks, shows the verdict             │
└──────────────────────────┬──────────────────────────────────┘
                           │  POST /simulate   {sunset, a, b, c, d}
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Server  ·  Python + Flask                                   │
│  A wire. Carries five bits in, one bit out. Decides nothing  │
└──────────────────────────┬──────────────────────────────────┘
                           │  vvp simulation +SUNSET=1 +A=0 ...
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Hardware  ·  Verilog, simulated with Icarus Verilog         │
│  ready = sunset & ~a & ~b & ~c & ~d                          │
└─────────────────────────────────────────────────────────────┘
```

## 1. The hardware — Verilog

| What | Detail |
|------|--------|
| Language | Verilog (IEEE 1364). Written in the classic structural style: one `Breadboard` module with an `always` block, one `testbench` module that drives it |
| File | `stargazing_controller.v` |
| Simulator | [Icarus Verilog](https://steveicarus.github.io/iverilog/). `iverilog` compiles the source into the `simulation` file, `vvp` runs it |
| The rule | `ready = sunset & ~a & ~b & ~c & ~d`. One AND gate with four inverters. True only after sunset when all four lamps are dark |
| Inputs | `SUNSET`, `A` (fountain), `B` (trail), `C` (playground), `D` (stargazing area) |
| Output | `READY` |
| How it talks to the outside | `$value$plusargs` reads the five inputs from the command line. `$display` prints one `RESULT ...` line that Python parses. With no arguments it prints the full 32-row truth table instead |

This is the only place in the project that knows the rule. Nothing in Python or
JavaScript computes `ready`.

## 2. The server — Python

| What | Detail |
|------|--------|
| Language | Python 3 |
| Framework | [Flask](https://flask.palletsprojects.com/), one file, two routes |
| File | `app.py` |
| `GET /` | Renders `templates/index.html` |
| `POST /simulate` | Takes a JSON body of five 0/1 values, runs the simulator, returns the hardware's answer as JSON |
| Running the hardware | `subprocess.run(["vvp", "simulation", "+SUNSET=1", "+A=0", ...])`. The `RESULT` line is pulled out with a regular expression |
| Auto rebuild | If `stargazing_controller.v` is newer than `simulation`, it recompiles with `iverilog` before running |
| Validation | Anything that is not 0 or 1 gets a 400. If the Verilog fails to compile, a 500 with the compiler output |
| Templating | Jinja2, which ships with Flask. The scene is split into partials under `templates/partials/` and stitched together with `{% include %}` |

Python is deliberately dumb here. It marshals bits, shells out, and parses one line.
The docstring at the top of `app.py` says it in one sentence: it is a wire.

## 3. The interface — HTML, CSS, SVG, JavaScript

Nothing is bundled, transpiled, or installed. The browser runs the files as written.

### Markup

| What | Detail |
|------|--------|
| Page | `templates/index.html`, a single full-screen `<svg>` with HTML overlays on top |
| Scene | Inline SVG, `viewBox="0 0 1200 700"`, cropped to fill the window with `preserveAspectRatio="xMidYMid slice"` |
| Walkable world | `world.js` lays the park out from above in metres: the gate, the drive and the cross path, the fountain plaza, the deck, the lake, the fence, and where every tree, bench and lamp stands. `engine.js` puts a camera at your eye and, every frame, projects all of it onto the screen: ground shapes as polygons, fences, railings and the fountain's basin wall as 3D geometry, standing things as sprites that face you and scale with distance, all sorted back to front. That is the whole 3D: a ground plane, a focal length and a horizon |
| Partials | `defs.html` (gradients, filters, textures, trees), `sprites.html` (bottom-centred templates for the fountain, swings, slide, seesaw, telescope, chairs, benches, picnic table, gate pillars, ducks, reeds), `sky.html`, `hills.html` (one repeating tile), and `interface.html` for the title, compass, status panel, movement pad, mini map and banner |
| Jinja loops | The ridge tree line is generated with `{% for %}` in the hills template rather than hand-written |
| Reusable objects | Trees and shrubs are drawn once inside `<defs>` and placed with `<use href="#tree-oak">` |
| Realism | `feTurbulence` filters multiply grain into the grass, asphalt, gravel, sand, and deck planks. `feDisplacementMap` roughens tree canopies so they stop looking like circles. Every material has its own gradient (galvanised steel, cast iron, car paint, glass, timber) |

### Styling

| What | Detail |
|------|--------|
| Plain CSS | Four files under `static/css/`, no preprocessor |
| `theme.css` | The whole day/night/stargaze look as CSS custom properties on `body.day`, `body.night`, `body.stargaze`. Changing the body class repaints everything |
| `base.css` | Page shell and the base font |
| `scene.css` | Sky layers, sun/moon, lamp posts, and the labels on them. Transitions fade between times of day |
| `interface.css` | Title, compass strip, status panel, movement pad, mini map, banner |
| Fonts | [Google Fonts](https://fonts.google.com/): **Cormorant Garamond** (title and banner), **Manrope** (interface text), **Barlow Condensed** (lamp labels and status readouts). System fonts take over if offline |
| Animation | CSS keyframes for clouds drifting, stars twinkling, shooting stars, the sun's glare. `prefers-reduced-motion` turns the clouds off |

### Behaviour

| What | Detail |
|------|--------|
| Language | Vanilla JavaScript, ES modules, no framework and no build step |
| `main.js` | Boot. Wires up clicks and asks the hardware about the opening state |
| `config.js` | The four zones, banner timing, star counts |
| `world.js` | The park as a map: positions in metres for every path, shape, fence, sprite, lamp and landmark, plus helpers that turn a polyline into a path of constant width |
| `engine.js` | The camera and the frame loop. Projects the world in perspective, clips what is behind you, sorts by depth, moves you with the keys, pad, drag or trackpad, keeps you out of the lake and the fountain and inside the fence, swings the gate open on your first click, and draws the compass and mini map |
| `park.js` | Tracks which switches you have flipped and paints the result. Does **not** know the stargazing rule |
| `verdict.js` | Posts the park's state to `/simulate` and waits. Numbers each request so a slow answer can never overwrite a newer one |
| `lamps.js` | The lamp post template, placed in the world by the engine, and the on/off paint |
| `panel.js` | The status readout and the hint line |
| `banner.js` | "It's time to stargaze", shown briefly then faded |
| `stars.js` | Procedural star field, drawn once at boot |
| `interact.js` | Scenery: swings sway toward the cursor with a damped spring, the seesaw tips under it, cars drag along the tarmac with their wheels turning. Pointer Events API, `requestAnimationFrame`, `getScreenCTM` to map the cursor into SVG coordinates |

The front end fails closed. Until the hardware answers, "Ready to stargaze" shows `...`.
If the server cannot be reached, it shows `NO`. The galaxy only appears when Verilog says so.

## Tools

| Tool | Used for |
|------|----------|
| Icarus Verilog 13 | Compiling and simulating the hardware |
| Python 3 + Flask 3 | Serving the page and running the simulator |
| VS Code | Editing |
| Git | Version control |
| A browser | Chrome or Safari. Everything is standard SVG and CSS |

## Why it is split this way

The project exists to show a hardware decision driving a software interface. If
JavaScript computed `ready`, the Verilog would be decoration. So the rule lives in one
`.v` file, Python is kept too thin to hide logic in, and the browser is told what the
answer is rather than working it out.
