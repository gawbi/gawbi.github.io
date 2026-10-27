import { useEffect, useRef } from "react";

/* Stylised two-channel input: mel spectrogram (cool) + wavelet scalogram (hot). */

const COLS = 64;
const ROWS = 22;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function ramp(stops: [number, number, number][], t: number) {
  t = Math.max(0, Math.min(1, t));
  const s = t * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(s));
  const f = s - i;
  const [a, b] = [stops[i], stops[i + 1]];
  return `rgb(${lerp(a[0], b[0], f) | 0},${lerp(a[1], b[1], f) | 0},${lerp(a[2], b[2], f) | 0})`;
}

const cool: [number, number, number][] = [
  [11, 13, 17],
  [24, 40, 92],
  [40, 120, 150],
  [94, 234, 212],
  [230, 255, 250],
];
const hot: [number, number, number][] = [
  [11, 13, 17],
  [70, 24, 30],
  [170, 60, 40],
  [255, 107, 61],
  [255, 225, 200],
];

function mel(c: number, r: number) {
  const t = c / COLS;
  const f = 1 - r / ROWS;
  const voiced = 0.5 + 0.5 * Math.sin(t * 9.5) > 0.32 ? 1 : 0.25;
  let v = 0;
  for (let h = 1; h <= 5; h++) {
    const centre = 0.08 * h + 0.03 * Math.sin(t * 6 + h);
    v += Math.exp(-Math.pow((f - centre) / 0.022, 2)) * (1.1 - h * 0.15);
  }
  v = v * voiced + 0.12 * Math.abs(Math.sin(c * 12.9898 + r * 78.233) * 43758.5453 % 1);
  return v * (1 - f * 0.5);
}

function wavelet(c: number, r: number) {
  const t = c / COLS;
  const scale = r / ROWS;
  const burst = Math.exp(-Math.pow((t - 0.32) / 0.05, 2)) + 0.8 * Math.exp(-Math.pow((t - 0.71) / 0.04, 2));
  const tone = 0.55 * Math.exp(-Math.pow((scale - 0.62) / 0.12, 2)) * (0.6 + 0.4 * Math.sin(t * 18));
  return burst * (1 - scale) * 1.1 + tone;
}

export function SpectroViz() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const draw = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = r.width * dpr;
      canvas.height = r.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const gap = 10;
      const ph = (r.height - gap) / 2;
      const cw = r.width / COLS;
      const ch = ph / ROWS;
      for (let c = 0; c < COLS; c++) {
        for (let row = 0; row < ROWS; row++) {
          ctx.fillStyle = ramp(cool, mel(c, row));
          ctx.fillRect(c * cw, row * ch, cw - 1, ch - 1);
          ctx.fillStyle = ramp(hot, wavelet(c, row));
          ctx.fillRect(c * cw, ph + gap + row * ch, cw - 1, ch - 1);
        }
      }
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="viz viz-spectro" aria-hidden>
      <canvas ref={ref} />
      <span className="spectro-sweep">
        <i />
      </span>
      <span className="viz-tag" style={{ top: "4%" }}>
        CH1 · mel
      </span>
      <span className="viz-tag" style={{ top: "54%" }}>
        CH2 · wavelet
      </span>
    </div>
  );
}
