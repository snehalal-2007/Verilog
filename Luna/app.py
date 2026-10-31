"""
Luna — stargazing park.

Python's job here is deliberately small: it carries the state of the
park from the browser to the SystemVerilog simulation and carries the
answer back. It does not decide anything. The rule about when it is
time to stargaze lives in stargazing_controller.v and nowhere else.
"""

from flask import Flask, render_template, request, jsonify
from pathlib import Path
import subprocess
import os
import re

app = Flask(__name__)

ROOT       = Path(__file__).parent
SIMULATION = ROOT / "simulation"
SOURCES    = [ROOT / "stargazing_controller.v"]   # Breadboard + testbench in one file

# The five values the hardware takes, in the order it prints them back.
INPUTS = ["sunset", "a", "b", "c", "d"]

RESULT_LINE = re.compile(
    r"RESULT SUNSET=(\d) A=(\d) B=(\d) C=(\d) D=(\d) READY=(\d)"
)


def build_if_stale():
    """Recompile when the .v file is newer than the binary (~37ms)."""

    if not SIMULATION.exists():
        stale = True
    else:
        built = SIMULATION.stat().st_mtime
        stale = any(s.stat().st_mtime > built for s in SOURCES)

    if not stale:
        return None

    result = subprocess.run(
        ["iverilog", "-o", str(SIMULATION)] + [str(s) for s in SOURCES],
        capture_output=True, text=True
    )

    return None if result.returncode == 0 else (result.stderr or result.stdout)


def as_bit(value, name):
    """Accept 0/1, "0"/"1", True/False — reject anything else."""

    if isinstance(value, bool):
        return 1 if value else 0

    try:
        bit = int(value)
    except (TypeError, ValueError):
        raise ValueError(f"{name} must be 0 or 1, got {value!r}")

    if bit not in (0, 1):
        raise ValueError(f"{name} must be 0 or 1, got {value!r}")

    return bit


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/simulate", methods=["POST"])
def simulate():
    """Hand the park's state to the hardware and relay its verdict."""

    data = request.get_json(silent=True) or {}

    # Marshal the five values. No interpretation of them happens here.
    try:
        bits = {name: as_bit(data.get(name, 0), name) for name in INPUTS}
    except ValueError as bad:
        return jsonify({"error": str(bad)}), 400

    build_error = build_if_stale()
    if build_error:
        return jsonify({"error": "Verilog failed to compile",
                        "output": build_error}), 500

    plusargs = [f"+{name.upper()}={bit}" for name, bit in bits.items()]

    run = subprocess.run(["vvp", str(SIMULATION)] + plusargs,
                         capture_output=True, text=True, cwd=ROOT)

    match = RESULT_LINE.search(run.stdout)

    if not match:
        return jsonify({"error": "Could not read the simulation output",
                        "output": run.stdout + run.stderr}), 500

    values = [int(v) for v in match.groups()]

    return jsonify({
        "sunset": values[0],
        "a": values[1],
        "b": values[2],
        "c": values[3],
        "d": values[4],
        "ready": values[5],                 # the hardware's verdict
        "raw": match.group(0)               # shown in the UI, handy while learning
    })


if __name__ == "__main__":
    # Port 5000 is taken by macOS Control Center (AirPlay Receiver), so
    # the default is 5050. Override with PORT=xxxx if that one is busy too.
    app.run(debug=True, port=int(os.environ.get("PORT", 5050)))
