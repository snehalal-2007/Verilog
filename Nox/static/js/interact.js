/* ==============================================================
   interact.js — the park responds to the cursor
   --------------------------------------------------------------
   Three things move:

     swings   sway toward the cursor while it is near them, then
              carry on swinging and settle by themselves
     seesaw   tips as though the cursor were weight on that end
     cars     are dragged along the tarmac, wheels turning

   Nothing here touches the stargazing state. This is scenery.
   ============================================================== */

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const DEG = 180 / Math.PI;


/* --------------------------------------------------------------
   Pointer position, in the local coordinates of a given element.
   The scene is scaled and cropped by preserveAspectRatio, so we
   have to ask the browser for the real matrix rather than guess.
----------------------------------------------------------------- */
function localPoint(svg, element, event) {
    const matrix = element.getScreenCTM();
    if (!matrix) return null;

    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;

    return point.matrixTransform(matrix.inverse());
}


/* --------------------------------------------------------------
   A damped angular spring — the one bit of physics in the file.
   `stiffness` pulls the angle toward its target, `damping` bleeds
   the energy away. Low damping overshoots and oscillates, which
   is exactly what a swing should do.
----------------------------------------------------------------- */
function makeSpring(element, pivotX, pivotY, rest) {
    return {
        el: element,
        px: pivotX,
        py: pivotY,
        rest,
        angle: rest,
        velocity: 0,
        target: rest,
        stiffness: 60,
        damping: 2.4
    };
}

function advance(spring, dt) {
    const pull = -spring.stiffness * (spring.angle - spring.target);
    const drag = -spring.damping * spring.velocity;

    spring.velocity += (pull + drag) * dt;
    spring.angle    += spring.velocity * dt;

    spring.el.setAttribute(
        "transform",
        `rotate(${spring.angle.toFixed(3)}, ${spring.px}, ${spring.py})`
    );
}


export function initInteractions() {

    const svg = document.getElementById("scene");
    if (!svg) return;

    const springs = [];


    /* ---------------- swings ---------------- */

    const swings = [...document.querySelectorAll(".swing")].map(el => {

        const pivotX = +el.dataset.pivotX;
        const pivotY = +el.dataset.pivotY;

        const spring = makeSpring(el, pivotX, pivotY, 0);
        springs.push(spring);

        return {
            spring,
            frame: el.parentNode,          // untransformed by the swinging
            reach: +el.dataset.reach || 60
        };
    });

    function aimSwings(event) {
        swings.forEach(({ spring, frame, reach }) => {

            const p = localPoint(svg, frame, event);
            if (!p) return;

            const dx = p.x - spring.px;
            const dy = p.y - spring.py;

            // only react to a cursor that is near, and below the bar
            const near = dy > -6 && Math.hypot(dx, dy) < reach;

            if (near) {
                // lean the swing toward the cursor, as if pushed
                spring.target    = clamp(Math.atan2(dx, Math.max(dy, 1)) * DEG, -38, 38);
                spring.stiffness = 90;
                spring.damping   = 8;       // follows the cursor closely
            } else {
                spring.target    = 0;
                spring.stiffness = 62;
                spring.damping   = 1.5;     // let go: swing and settle
            }
        });
    }


    /* ---------------- seesaw ---------------- */

    const seesaws = [...document.querySelectorAll(".seesaw")].map(el => {

        const rest   = +el.dataset.rest || 0;
        const spring = makeSpring(el, +el.dataset.pivotX, +el.dataset.pivotY, rest);

        spring.stiffness = 110;
        spring.damping   = 7;              // a little bounce as it lands
        springs.push(spring);

        return { spring, frame: el.parentNode, half: +el.dataset.half || 46, rest };
    });

    function aimSeesaws(event) {
        seesaws.forEach(({ spring, frame, half, rest }) => {

            const p = localPoint(svg, frame, event);
            if (!p) return;

            const dx = p.x - spring.px;
            const dy = p.y - spring.py;

            const over = Math.abs(dx) < half + 14 && dy > -30 && dy < 34;

            // weight on one end tips that end down; further out presses harder
            spring.target = over ? clamp((dx / half) * 17, -17, 17) : rest;
        });
    }


    /* ---------------- cars ----------------
       The lamp posts have generous invisible click targets that reach
       across the tarmac, so a car parked under one would be unreachable
       if we simply bound pointerdown to the car. Instead we hit-test
       the whole stack under the cursor ourselves: a visible car always
       wins over an invisible target behind it.
    ----------------------------------------- */

    const cars = [...document.querySelectorAll(".car")].map(el => ({
        el,
        x:     +el.dataset.x,
        y:     +el.dataset.y,
        scale: +el.dataset.scale,
        minX:  +el.dataset.minX,
        maxX:  +el.dataset.maxX,
        spin:  0,
        wheels: [...el.querySelectorAll(".wheel")].map(w => ({
            el: w, cx: +w.dataset.cx, cy: +w.dataset.cy
        }))
    }));

    function placeCar(car) {
        car.el.setAttribute("transform",
            `translate(${car.x.toFixed(2)}, ${car.y}) scale(${car.scale})`);
        car.wheels.forEach(w => w.el.setAttribute(
            "transform", `rotate(${car.spin.toFixed(1)}, ${w.cx}, ${w.cy})`));
    }

    let driving = null;
    let grabDx  = 0;
    let dragged = false;

    function carUnder(event) {
        for (const el of document.elementsFromPoint(event.clientX, event.clientY)) {
            const hit = el.closest?.(".car");
            if (hit) return cars.find(c => c.el === hit) || null;
        }
        return null;
    }

    svg.addEventListener("pointerdown", event => {

        const car = carUnder(event);
        if (!car) return;                     // leave the click for the lamps

        const p = localPoint(svg, car.el.parentNode, event);
        if (!p) return;

        driving = car;
        grabDx  = p.x - car.x;
        dragged = false;

        car.el.classList.add("driving");
        svg.setPointerCapture(event.pointerId);
        event.preventDefault();
    });

    svg.addEventListener("pointermove", event => {
        if (!driving) return;

        const p = localPoint(svg, driving.el.parentNode, event);
        if (!p) return;

        const wanted = clamp(p.x - grabDx, driving.minX, driving.maxX);
        const moved  = wanted - driving.x;

        if (Math.abs(moved) > 0.01) dragged = true;

        // roll the wheels by the distance travelled: arc over radius
        driving.spin += (moved / driving.scale / 7) * DEG;
        driving.x = wanted;

        placeCar(driving);
    });

    function dropCar(event) {
        if (!driving) return;

        driving.el.classList.remove("driving");

        // a drag must not also toggle whatever lamp sits behind the car
        if (dragged) {
            window.addEventListener("click",
                e => { e.stopPropagation(); e.preventDefault(); },
                { capture: true, once: true });
        }

        driving = null;
        if (svg.hasPointerCapture?.(event.pointerId)) {
            svg.releasePointerCapture(event.pointerId);
        }
    }

    svg.addEventListener("pointerup", dropCar);
    svg.addEventListener("pointercancel", dropCar);


    /* ---------------- drive it all ---------------- */

    svg.addEventListener("pointermove", event => {
        aimSwings(event);
        aimSeesaws(event);
    });

    // cursor gone: everything returns to rest
    svg.addEventListener("pointerleave", () => {
        swings.forEach(({ spring }) => {
            spring.target = 0;
            spring.stiffness = 62;
            spring.damping = 1.5;
        });
        seesaws.forEach(({ spring, rest }) => { spring.target = rest; });
    });

    let last = performance.now();

    (function tick(now) {
        // clamp dt so a backgrounded tab does not explode the springs
        const dt = Math.min((now - last) / 1000, 0.032);
        last = now;

        springs.forEach(s => advance(s, dt));
        requestAnimationFrame(tick);
    })(last);
}
