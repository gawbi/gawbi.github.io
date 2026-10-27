import { motion } from "motion/react";
import { grow, inViewOnce } from "../Reveal";

const rows = [
  { name: "융합 모델", v: 0.9832, note: "± 0.0007", cls: "f1-model" },
  { name: "TF-IDF 기준선", v: 0.9744, note: "표층 단서만", cls: "f1-base" },
];

/* Full 0–1 axis on purpose: the point is how little room is left above the baseline. */
export function F1Bars() {
  return (
    <motion.div className="viz viz-f1" aria-hidden {...inViewOnce}>
      {rows.map((r, i) => (
        <div className="f1-row" key={r.name}>
          <div className="f1-meta">
            <span>{r.name}</span>
            <span className="mono tabular">
              {r.v.toFixed(4)} <em>{r.note}</em>
            </span>
          </div>
          <div className="f1-track">
            <motion.span className={`f1-bar ${r.cls}`} variants={grow} custom={{ to: r.v, delay: 0.1 + i * 0.14 }} />
          </div>
        </div>
      ))}
      <div className="f1-axis mono">
        <span>0</span>
        <span>0.5</span>
        <span>1.0</span>
      </div>
      <motion.div
        className="f1-gap mono"
        variants={{ hidden: { opacity: 0 }, shown: { opacity: 1, transition: { duration: 0.6, delay: 1.3 } } }}
      >
        Δ 0.0088
      </motion.div>
    </motion.div>
  );
}
