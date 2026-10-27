import { useEffect, useRef, type RefObject } from "react";

/*
 * A live scope trace. The pointer "writes" disturbances into the signal at its
 * position; they scroll left with the trace. Whatever crosses the threshold is
 * boxed and counted as an anomaly — learn normal, catch what deviates.
 */

type Burst = { s: number; amp: number; w: number; phase: number; counted: boolean };

const SPEED = 54; // px per second the trace scrolls
const STEP = 2; // px between samples
const TH = 1.55; // threshold, in amplitude units
const CAP = 3.1;

function hash(i: number) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function vnoise(t: number) {
  const i = Math.floor(t);
  const f = t - i;
  const u = f * f * (3 - 2 * f);
  return (hash(i) + (hash(i + 1) - hash(i)) * u) * 2 - 1;
}

function baseSignal(s: number) {
  return (
    0.4 * Math.sin(s * 0.0115 + 0.3) +
    0.22 * Math.sin(s * 0.029 + 1.7) +
    0.11 * Math.sin(s * 0.071 + 0.4) +
    0.13 * vnoise(s * 0.045) +
    0.05 * vnoise(s * 0.5)
  );
}

function burstAt(b: Burst, s: number) {
  const d = (s - b.s) / b.w;
  if (d < -3.2 || d > 3.2) return 0;
  return b.amp * Math.exp(-d * d) * (0.72 + 0.28 * Math.sin((s - b.s) * 0.42 + b.phase));
}

export function SignalCanvas({
  hostRef,
  countRef,
  timeRef,
}: {
  hostRef: RefObject<HTMLElement | null>;
  countRef: RefObject<HTMLSpanElement | null>;
  timeRef: RefObject<HTMLSpanElement | null>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = matchMedia("(pointer: fine)").matches;

    let W = 0;
    let H = 0;
    let dpr = 1;
    let scroll = 0;
    let bursts: Burst[] = [];
    let detected = 0;
    let lastT = 0;
    let startT = 0;
    let raf = 0;
    let running = false;
    let nextAuto = 1.6;
    let idle = 99;
    let lastWrite = 0;
    let lastReadout = 0;

    const pointer = { x: -1, y: -1, px: -1, active: false, speed: 0, energy: 0 };

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width;
      H = r.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!running) draw(performance.now());
    };

    const seed = () => {
      bursts = [
        { s: W * 0.58, amp: 2.05, w: 15, phase: 0.6, counted: false },
        { s: W * 0.84, amp: 1.75, w: 11, phase: 2.1, counted: false },
      ];
    };

    const geom = () => {
      const mid = H * 0.58;
      const A = Math.min(H * 0.165, 66);
      return { mid, A, thY: mid - TH * A };
    };

    const valueAt = (s: number, x: number, t: number) => {
      let v = baseSignal(s);
      for (const b of bursts) v += burstAt(b, s);
      if (pointer.active && fine) {
        const dx = (x - pointer.x) / 46;
        v += 0.22 * pointer.energy * Math.exp(-dx * dx) * Math.sin(t * 15 + x * 0.21);
      }
      return Math.min(v, CAP);
    };

    function draw(now: number) {
      const t = now / 1000;
      const { mid, A, thY } = geom();
      ctx!.clearRect(0, 0, W, H);

      // graticule — fixed, like a real scope
      ctx!.strokeStyle = "rgba(255,255,255,0.045)";
      ctx!.lineWidth = 1;
      ctx!.beginPath();
      const cols = W < 700 ? 6 : 12;
      for (let i = 1; i < cols; i++) {
        const x = Math.round((W / cols) * i) + 0.5;
        ctx!.moveTo(x, 0);
        ctx!.lineTo(x, H);
      }
      for (let k = -8; k <= 6; k++) {
        const y = Math.round(mid + (k * A) / 2) + 0.5;
        ctx!.moveTo(0, y);
        ctx!.lineTo(W, y);
      }
      ctx!.stroke();

      // centre axis
      ctx!.strokeStyle = "rgba(255,255,255,0.09)";
      ctx!.beginPath();
      ctx!.moveTo(0, Math.round(mid) + 0.5);
      ctx!.lineTo(W, Math.round(mid) + 0.5);
      ctx!.stroke();

      // threshold
      ctx!.save();
      ctx!.setLineDash([6, 7]);
      ctx!.strokeStyle = "rgba(255,107,61,0.55)";
      ctx!.beginPath();
      ctx!.moveTo(0, Math.round(thY) + 0.5);
      ctx!.lineTo(W, Math.round(thY) + 0.5);
      ctx!.stroke();
      ctx!.restore();
      ctx!.font = "500 10px 'JetBrains Mono Variable', ui-monospace, monospace";
      ctx!.fillStyle = "rgba(255,107,61,0.75)";
      ctx!.textAlign = "right";
      ctx!.fillText("THRESHOLD", W - 18, thY - 8);

      // intro sweep: trace draws in from the left
      const reveal = reduce ? 1 : Math.min(1, (now - startT) / 1500);
      const eased = 1 - Math.pow(1 - reveal, 3);
      const xMax = W * eased;

      const n = Math.ceil(xMax / STEP) + 1;
      const xs = new Float32Array(n);
      const vs = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const x = Math.min(i * STEP, xMax);
        xs[i] = x;
        vs[i] = valueAt(x + scroll, x, t);
      }
      const yOf = (v: number) => mid - v * A;

      // ghost channel underneath for depth
      if (W >= 700) {
        ctx!.strokeStyle = "rgba(255,255,255,0.10)";
        ctx!.lineWidth = 1;
        ctx!.beginPath();
        for (let i = 0; i < n; i++) {
          const s = xs[i] + scroll;
          const v = 0.55 * Math.sin(s * 0.019 + 2) + 0.25 * vnoise(s * 0.06 + 40);
          const y = mid + A * 1.25 - v * A * 0.3;
          i ? ctx!.lineTo(xs[i], y) : ctx!.moveTo(xs[i], y);
        }
        ctx!.stroke();
      }

      // main trace: wide soft pass then a crisp pass
      const tracePath = () => {
        ctx!.beginPath();
        for (let i = 0; i < n; i++) {
          const y = yOf(vs[i]);
          i ? ctx!.lineTo(xs[i], y) : ctx!.moveTo(xs[i], y);
        }
      };
      tracePath();
      ctx!.strokeStyle = "rgba(94,234,212,0.13)";
      ctx!.lineWidth = 7;
      ctx!.lineJoin = "round";
      ctx!.stroke();
      ctx!.strokeStyle = "rgba(94,234,212,0.95)";
      ctx!.lineWidth = 1.6;
      ctx!.stroke();

      // find anomaly segments (merge small gaps)
      const segs: { a: number; b: number; peak: number; peakI: number }[] = [];
      let cur: { a: number; b: number; peak: number; peakI: number } | null = null;
      for (let i = 0; i < n; i++) {
        if (vs[i] > TH) {
          if (cur && i - cur.b <= 16) {
            cur.b = i;
          } else {
            cur = { a: i, b: i, peak: vs[i], peakI: i };
            segs.push(cur);
          }
          if (vs[i] > cur.peak) {
            cur.peak = vs[i];
            cur.peakI = i;
          }
        }
      }

      let labelEdge = -Infinity;
      for (const seg of segs) {
        const a = Math.max(0, seg.a - 1);
        const b = Math.min(n - 1, seg.b + 1);

        // fill above threshold
        ctx!.beginPath();
        ctx!.moveTo(xs[a], thY);
        for (let i = a; i <= b; i++) ctx!.lineTo(xs[i], Math.min(thY, yOf(vs[i])));
        ctx!.lineTo(xs[b], thY);
        ctx!.closePath();
        ctx!.fillStyle = "rgba(255,107,61,0.16)";
        ctx!.fill();

        // hot trace over the segment
        ctx!.beginPath();
        for (let i = a; i <= b; i++) {
          const y = yOf(vs[i]);
          i === a ? ctx!.moveTo(xs[i], y) : ctx!.lineTo(xs[i], y);
        }
        ctx!.strokeStyle = "rgba(255,107,61,0.25)";
        ctx!.lineWidth = 8;
        ctx!.stroke();
        ctx!.strokeStyle = "#ff6b3d";
        ctx!.lineWidth = 1.8;
        ctx!.stroke();

        // corner-bracket box
        const x0 = xs[a] - 8;
        const x1 = xs[b] + 8;
        const y0 = yOf(seg.peak) - 10;
        const y1 = thY + 10;
        const c = Math.min(8, (x1 - x0) / 3);
        ctx!.strokeStyle = "rgba(255,107,61,0.9)";
        ctx!.lineWidth = 1.2;
        ctx!.beginPath();
        ctx!.moveTo(x0, y0 + c);
        ctx!.lineTo(x0, y0);
        ctx!.lineTo(x0 + c, y0);
        ctx!.moveTo(x1 - c, y0);
        ctx!.lineTo(x1, y0);
        ctx!.lineTo(x1, y0 + c);
        ctx!.moveTo(x1, y1 - c);
        ctx!.lineTo(x1, y1);
        ctx!.lineTo(x1 - c, y1);
        ctx!.moveTo(x0 + c, y1);
        ctx!.lineTo(x0, y1);
        ctx!.lineTo(x0, y1 - c);
        ctx!.stroke();

        // label chip
        const score = Math.min(0.99, 0.5 + (seg.peak - TH) / (CAP - TH) / 2).toFixed(2);
        const label = `ANOMALY ${score}`;
        ctx!.font = "600 10px 'JetBrains Mono Variable', ui-monospace, monospace";
        const tw = ctx!.measureText(label).width;
        const lx = Math.min(Math.max(x0, 4), W - tw - 16);
        const ly = Math.max(2, y0 - 22);
        if (lx < labelEdge + 8) continue;
        labelEdge = lx + tw + 12;
        ctx!.fillStyle = "#ff6b3d";
        ctx!.beginPath();
        ctx!.roundRect(lx, ly, tw + 12, 16, 3);
        ctx!.fill();
        ctx!.fillStyle = "#14080a";
        ctx!.textAlign = "left";
        ctx!.fillText(label, lx + 6, ly + 11.5);
      }

      // instrument cursor
      if (pointer.active && fine && pointer.x >= 0 && pointer.x <= xMax) {
        const i = Math.round(pointer.x / STEP);
        const v = vs[Math.min(n - 1, Math.max(0, i))];
        const y = yOf(v);
        const hot = v > TH;
        ctx!.save();
        ctx!.setLineDash([2, 4]);
        ctx!.strokeStyle = "rgba(255,255,255,0.22)";
        ctx!.lineWidth = 1;
        ctx!.beginPath();
        ctx!.moveTo(Math.round(pointer.x) + 0.5, 0);
        ctx!.lineTo(Math.round(pointer.x) + 0.5, H);
        ctx!.stroke();
        ctx!.restore();
        ctx!.fillStyle = hot ? "#ff6b3d" : "#5eead4";
        ctx!.beginPath();
        ctx!.arc(pointer.x, y, 3.5, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.font = "500 10px 'JetBrains Mono Variable', ui-monospace, monospace";
        ctx!.fillStyle = "rgba(236,239,243,0.7)";
        const right = pointer.x < W - 120;
        ctx!.textAlign = right ? "left" : "right";
        ctx!.fillText(`v ${v.toFixed(2)}`, pointer.x + (right ? 10 : -10), 14);
      }
    }

    const step = (now: number) => {
      const dt = Math.min(0.05, (now - lastT) / 1000 || 0);
      lastT = now;
      const t = now / 1000;
      scroll += SPEED * dt;

      // pointer energy: spring toward current speed, decays when still
      pointer.energy += (Math.min(pointer.speed / 14, 1) - pointer.energy) * 0.12;
      pointer.speed *= 0.86;
      idle += dt;

      // the pointer writes bursts into the signal where it moves
      if (pointer.active && pointer.speed > 4 && t - lastWrite > 0.11) {
        lastWrite = t;
        bursts.push({
          s: pointer.x + scroll,
          amp: Math.min(0.45 + pointer.speed * 0.055, 2.3),
          w: 9 + Math.random() * 12,
          phase: Math.random() * 6.28,
          counted: false,
        });
      }

      // when nobody is touching it, the system still produces the odd anomaly
      nextAuto -= dt;
      if (nextAuto <= 0 && idle > 2) {
        nextAuto = 2.6 + Math.random() * 2.4;
        bursts.push({
          s: scroll + W + 40,
          amp: 1.6 + Math.random() * 0.9,
          w: 10 + Math.random() * 16,
          phase: Math.random() * 6.28,
          counted: false,
        });
      }

      bursts = bursts.filter((b) => b.s - scroll > -160).slice(-90);

      for (const b of bursts) {
        if (b.counted) continue;
        const x = b.s - scroll;
        if (x < 0 || x > W) continue;
        let v = baseSignal(b.s);
        for (const o of bursts) v += burstAt(o, b.s);
        if (v > TH) {
          b.counted = true;
          detected++;
          if (countRef.current) countRef.current.textContent = String(detected).padStart(3, "0");
        }
      }

      if (t - lastReadout > 0.1 && timeRef.current) {
        lastReadout = t;
        timeRef.current.textContent = (scroll / SPEED).toFixed(1);
      }

      draw(now);
      raf = requestAnimationFrame(step);
    };

    const start = () => {
      if (running || reduce) return;
      running = true;
      lastT = performance.now();
      raf = requestAnimationFrame(step);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      if (pointer.px >= 0) pointer.speed = Math.max(pointer.speed, Math.abs(x - pointer.px) + Math.abs(e.movementY || 0) * 0.5);
      pointer.px = x;
      pointer.x = x;
      pointer.y = e.clientY - r.top;
      pointer.active = true;
      idle = 0;
    };
    const onLeave = () => {
      pointer.active = false;
      pointer.px = -1;
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left;
      idle = 0;
      bursts.push({ s: x + scroll, amp: 2.2, w: 16, phase: Math.random() * 6.28, counted: false });
    };

    resize();
    seed();
    startT = performance.now();
    draw(startT);

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()));
    io.observe(canvas);
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    host.addEventListener("pointerdown", onDown);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      host.removeEventListener("pointerdown", onDown);
    };
  }, [hostRef, countRef, timeRef]);

  return <canvas ref={canvasRef} className="scope-canvas" aria-hidden />;
}
