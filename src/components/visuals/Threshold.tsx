import { motion } from "motion/react";
import { EASE_OUT } from "../Reveal";

// Deterministic "reconstruction error" trace: quiet baseline with two attack windows.
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
}

const W = 600;
const H = 220;
const TH_Y = 92;
const attacks = [
  { x0: 205, x1: 262, peak: 46 },
  { x0: 430, x1: 470, peak: 60 },
];

const points = (() => {
  const r = rng(7);
  const pts: [number, number][] = [];
  for (let x = 0; x <= W; x += 4) {
    let y = 168 + Math.sin(x * 0.045) * 6 + (r() - 0.5) * 14;
    for (const a of attacks) {
      if (x >= a.x0 - 10 && x <= a.x1 + 10) {
        const c = (a.x0 + a.x1) / 2;
        const half = (a.x1 - a.x0) / 2 + 10;
        const k = 1 - Math.abs(x - c) / half;
        y -= (168 - a.peak) * Math.pow(Math.max(0, k), 0.6) * (0.82 + r() * 0.18);
      }
    }
    pts.push([x, y]);
  }
  return pts;
})();

const d = points.map(([x, y], i) => `${i ? "L" : "M"}${x},${y.toFixed(1)}`).join(" ");

export function ThresholdViz() {
  return (
    <svg className="viz viz-threshold" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden>
      {[50, 100, 150, 200].map((y) => (
        <line key={y} x1="0" x2={W} y1={y} y2={y} className="viz-grid" />
      ))}
      <line x1="0" x2={W} y1={TH_Y} y2={TH_Y} className="viz-th" />
      {attacks.map((a, i) => (
        <motion.rect
          key={i}
          x={a.x0 - 16}
          y={a.peak - 14}
          width={a.x1 - a.x0 + 32}
          height={H - a.peak - 6}
          className="viz-attack"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 1.0 + i * 0.25 }}
        />
      ))}
      <motion.path
        d={d}
        className="viz-trace"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true, margin: "-10% 0px" }}
        transition={{ duration: 1.8, ease: EASE_OUT }}
      />
    </svg>
  );
}

export function ThresholdLabels() {
  return (
    <div className="viz-labels">
      <span className="viz-tag">VAE 재구성 오차 · UAV</span>
      <span className="viz-tag viz-tag-hot" style={{ left: `${(attacks[0].x0 / W) * 100}%`, top: "4%" }}>
        ATTACK
      </span>
      <span className="viz-tag viz-tag-hot" style={{ left: `${(attacks[1].x0 / W) * 100}%`, top: "4%" }}>
        ATTACK
      </span>
      <span className="viz-tag viz-tag-th" style={{ top: `${(TH_Y / H) * 100}%` }}>
        threshold
      </span>
    </div>
  );
}
