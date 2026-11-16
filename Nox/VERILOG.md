# Nox — What the Verilog Does

Everything about *when it is time to stargaze* is decided in one file, `stargazing_controller.v`. The game and the server only pass values to it and show its answer. This page walks through that file.

## The question

The park has a sun and four lamps. Stargazing needs darkness, so the answer is yes only when the sun has set **and** every lamp is off.

| Signal | Direction | Meaning |
|--------|-----------|---------|
| `sunset` | input | 1 after sunset, 0 during the day |
| `a` | input | Fountain lamp (1 = lit, 0 = dark) |
| `b` | input | Trail lamp |
| `c` | input | Playground lamp |
| `d` | input | Stargazing area lamp |
| `ready` | output | 1 = time to stargaze |

## The rule

```
ready = sunset & ~a & ~b & ~c & ~d
```

In Boolean algebra this is `S · A' · B' · C' · D'`. As a circuit it is four inverters (one per lamp) feeding a single five-input AND gate.

`sunset` has to be part of it. In the daytime all four lamps are off too, so without `sunset` the circuit would say "stargaze" at noon.

## The file has two modules

### 1. `Breadboard` — the logic

```verilog
module Breadboard (sunset,a,b,c,d,ready);
input sunset,a,b,c,d;
output ready;
wire sunset,a,b,c,d;
reg ready;

always @ (sunset,a,b,c,d) begin
    ready = (sunset) & (~a) & (~b) & (~c) & (~d);
end

endmodule
```

- The five inputs are `wire`s: they just carry whatever value is driven into them.
- `ready` is a `reg` because it is assigned inside an `always` block.
- `always @ (sunset,a,b,c,d)` means "run this again whenever any input changes". That makes it combinational logic: there is no clock and no memory, and the output depends only on the inputs right now.
- `&` is AND and `~` is NOT.

### 2. `testbench` — the thing that drives it

A module can't run by itself. The testbench creates one copy of the breadboard, sets its inputs and prints what comes out:

```verilog
Breadboard bb(s,a,b,c,d,ready);
```

`s`, `a`, `b`, `c`, `d` are `reg`s the testbench writes to, and `ready` is a `wire` that carries the breadboard's answer back.

The `initial` block runs once when the simulation starts. It has two modes, chosen by whether `+SUNSET=` was given on the command line.

**Mode 1: one state (what the game uses).** `$value$plusargs("SUNSET=%d", value)` reads `+SUNSET=1` from the command line. If it is there, the testbench reads `+A=`, `+B=`, `+C=` and `+D=` the same way (a lamp that is left out counts as 0), waits 10 time units (`#10`) so the breadboard settles, and prints one line:

```
RESULT SUNSET=1 A=0 B=0 C=0 D=0 READY=1
```

**Mode 2: the whole truth table.** With no `+SUNSET=`, a `for` loop counts `i` from 0 to 31 and uses the bits of `i` as the inputs: `s=i/16`, `a=i/8`, `b=i/4`, `c=i/2`, `d=i/1`. Each variable is one bit wide, so only the lowest bit of each division is kept, which is exactly that input's column in a binary count. After each `#10` delay it prints a row.

Both modes end with `$finish`, which stops the simulator.

## The truth table

Five inputs give 2⁵ = 32 rows. `READY` is 1 in exactly one of them, row 16:

```
|##|S|A|B|C|D|READY|
|==+=+=+=+=+=+=====|
| 0|0|0|0|0|0|  0  |   daytime, lamps off: still not ready
  ...
|15|0|1|1|1|1|  0  |
|--+-+-+-+-+-+-----|
|16|1|0|0|0|0|  1  |   night, all four lamps dark
|17|1|0|0|0|1|  0  |   one lamp is enough to spoil it
  ...
|31|1|1|1|1|1|  0  |
```

Rows 0 to 15 are daytime (`S=0`), so they are all 0. Rows 17 to 31 are night with at least one lamp lit, so they are 0 too.

## Running it by hand

Compile the source into the `simulation` file:

```sh
iverilog -o simulation stargazing_controller.v
```

Print the full truth table:

```sh
vvp simulation
```

Ask about one state:

```sh
vvp simulation +SUNSET=1 +A=0 +B=0 +C=0 +D=0
```

`+SUNSET=` is what selects the one-line mode. If you leave it out you get the truth table, even if you pass lamps.

`iverilog` is the compiler and `vvp` is the runtime that executes the compiled file. The line `$finish called at ...` after the output is the simulator saying it stopped, not an error.

## What happens when Nox touches a lamp

1. The game (`frontend/src/game/engine.js`) notes the lamp is now off and reports the sun and all four lamps. It does not know the rule.
2. `frontend/src/api.js` sends them to the server: `POST /simulate` with `{"sunset":1,"a":0,"b":1,"c":0,"d":0}`.
3. `app.py` checks each value is 0 or 1, recompiles with `iverilog` if the `.v` file changed, then runs `vvp simulation +SUNSET=1 +A=0 +B=1 +C=0 +D=0`.
4. The testbench drives the breadboard and prints `RESULT ... READY=0`.
5. `app.py` picks that line out with a regular expression and returns it as JSON.
6. The game shows the stars only if `ready` came back as 1. If the server or simulator can't be reached, it never does.

The same thing happens at the start of the night, when the lamps come on one by one after sunset. So a full night is eight simulator runs: four as the lamps switch on and four as Nox switches them off. You can watch them arrive at <http://localhost:5050/verilog> or in the terminal running `app.py`.

## Changing the rule

Edit the one line inside the `always` block and save. The server notices the file is newer than `simulation` and recompiles on the next request. Nothing in Python or JavaScript needs to change, because neither of them contains the rule.

Adding or removing an input is a bigger change: the module ports, the testbench plusargs and `RESULT` line, the `INPUTS` list and `RESULT_LINE` pattern in `app.py`, and the lamps in the game all have to match.
