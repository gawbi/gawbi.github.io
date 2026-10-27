import { useEffect, useRef } from "react";

/*
 * Two-link arm, analytic IK. Follows the pointer over the card; idles on a
 * Lissajous path. The readout checks IK by feeding it back through FK —
 * the same test robotics-from-scratch plans to use.
 */

const W = 320;
const H = 200;
const BX = 160;
const BY = 178;
const L1 = 70;
const L2 = 54;

export function ArmViz({ hostRef }: { hostRef: React.RefObject<HTMLElement | null> }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const link1 = useRef<SVGLineElement>(null);
  const link2 = useRef<SVGLineElement>(null);
  const joint = useRef<SVGCircleElement>(null);
  const ee = useRef<SVGCircleElement>(null);
  const target = useRef<SVGGElement>(null);
  const readout = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    const host = hostRef.current;
    if (!svg || !host) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

    let tx = BX + 40;
    let ty = BY - 80;
    let gx = tx;
    let gy = ty;
    let hover = false;
    let raf = 0;
    let visible = false;
    let lastText = "";

    const solve = (x: number, y: number) => {
      const dx = x - BX;
      const dy = BY - y;
      const dist = Math.hypot(dx, dy);
      const reach = Math.min(Math.max(dist, Math.abs(L1 - L2) + 0.01), L1 + L2 - 0.01);
      const c2 = (reach * reach - L1 * L1 - L2 * L2) / (2 * L1 * L2);
      const t2 = Math.acos(Math.max(-1, Math.min(1, c2)));
      const t1 = Math.atan2(dy, dx) - Math.atan2(L2 * Math.sin(t2), L1 + L2 * Math.cos(t2));
      const jx = BX + L1 * Math.cos(t1);
      const jy = BY - L1 * Math.sin(t1);
      const ex = jx + L2 * Math.cos(t1 + t2);
      const ey = jy - L2 * Math.sin(t1 + t2);
      const err = Math.hypot(ex - x, ey - y);
      return { t1, t2, jx, jy, ex, ey, err };
    };

    const render = (time: number) => {
      if (!hover) {
        const s = time / 1000;
        gx = BX + 58 * Math.sin(s * 0.7);
        gy = BY - 78 + 36 * Math.sin(s * 1.1 + 0.6);
      }
      tx += (gx - tx) * 0.18;
      ty += (gy - ty) * 0.18;
      const k = solve(tx, ty);
      link1.current?.setAttribute("x2", String(k.jx));
      link1.current?.setAttribute("y2", String(k.jy));
      link2.current?.setAttribute("x1", String(k.jx));
      link2.current?.setAttribute("y1", String(k.jy));
      link2.current?.setAttribute("x2", String(k.ex));
      link2.current?.setAttribute("y2", String(k.ey));
      joint.current?.setAttribute("cx", String(k.jx));
      joint.current?.setAttribute("cy", String(k.jy));
      ee.current?.setAttribute("cx", String(k.ex));
      ee.current?.setAttribute("cy", String(k.ey));
      target.current?.setAttribute("transform", `translate(${tx} ${ty})`);
      const out = k.err > 0.5;
      svg.dataset.out = String(out);
      const deg = (r: number) => ((r * 180) / Math.PI).toFixed(1).padStart(6, " ");
      const text = `q1 ${deg(k.t1)}°  q2 ${deg(k.t2)}°  ‖FK(IK(x))−x‖ ${out ? k.err.toFixed(1) + " · out of reach" : "0.00"}`;
      if (text !== lastText && readout.current) {
        lastText = text;
        readout.current.textContent = text;
      }
    };

    const loop = (time: number) => {
      render(time);
      raf = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      const m = svg.getScreenCTM();
      if (!m) return;
      const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
      gx = p.x;
      gy = p.y;
      hover = true;
    };
    const onLeave = () => (hover = false);

    render(0);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible && !reduce) raf = requestAnimationFrame(loop);
    });
    io.observe(svg);
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, [hostRef]);

  return (
    <div className="viz viz-arm" aria-hidden>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`}>
        <circle cx={BX} cy={BY} r={L1 + L2} className="arm-reach" />
        <circle cx={BX} cy={BY} r={L1 - L2} className="arm-reach" />
        <line x1={BX - 40} x2={BX + 40} y1={BY + 10} y2={BY + 10} className="arm-ground" />
        <line ref={link1} x1={BX} y1={BY} x2={BX} y2={BY - L1} className="arm-link" />
        <line ref={link2} x1={BX} y1={BY - L1} x2={BX} y2={BY - L1 - L2} className="arm-link arm-link-2" />
        <circle cx={BX} cy={BY} r="6" className="arm-joint" />
        <circle ref={joint} cx={BX} cy={BY - L1} r="5" className="arm-joint" />
        <circle ref={ee} cx={BX} cy={BY - L1 - L2} r="3.5" className="arm-ee" />
        <g ref={target} className="arm-target">
          <circle r="7" />
          <line x1="-11" x2="-4" y1="0" y2="0" />
          <line x1="4" x2="11" y1="0" y2="0" />
          <line y1="-11" y2="-4" x1="0" x2="0" />
          <line y1="4" y2="11" x1="0" x2="0" />
        </g>
      </svg>
      <span className="arm-readout mono" ref={readout} />
    </div>
  );
}
