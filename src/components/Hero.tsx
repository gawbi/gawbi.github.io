import { useEffect, useRef, useState } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "motion/react";
import { profile } from "../data";
import { scrollToId } from "../lib/smooth";
import type { RobotScene } from "../robot/scene";
import { ArrowDown, GitHub } from "./Icons";
import { EASE_OUT, RevealLines } from "./Reveal";
import { SignalCanvas, type Sampler } from "./SignalCanvas";
import "../styles/hero.css";

// right leg, sagittal chain: the joints that do the walking
const LABEL_JOINTS = [7, 8, 9];
const LABEL_NAMES = ["R hip_pitch", "R knee", "R ankle"];
const KNEE = 8;
const HIP = 7;

const STEPS = [
  { n: "01", label: "Walk", from: 0 },
  { n: "02", label: "Joints", from: 0.22 },
  { n: "03", label: "Signal", from: 0.57 },
];

const fade = (delay: number) => ({
  initial: { opacity: 0, transform: "translateY(12px)" },
  animate: { opacity: 1, transform: "translateY(0px)" },
  transition: { duration: 0.9, ease: EASE_OUT, delay },
});

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const glRef = useRef<HTMLCanvasElement>(null);
  const labelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const frameRef = useRef<HTMLSpanElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const source = useRef<Sampler | null>(null);
  const ghost = useRef<Sampler | null>(null);
  const scopeActive = useRef(false);
  const reduce = useReducedMotion();
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  const [step, setStep] = useState(0);

  const { scrollYProgress: p } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });

  const aOpacity = useTransform(p, [0, 0.11, 0.18], [1, 1, 0]);
  const aY = useTransform(p, [0, 0.18], ["0px", "-48px"]);
  const aEvents = useTransform(p, (v) => (v < 0.16 ? "auto" : "none"));
  const bOpacity = useTransform(p, [0.24, 0.3, 0.5, 0.56], [0, 1, 1, 0]);
  const bY = useTransform(p, [0.24, 0.3], ["24px", "0px"]);
  const cOpacity = useTransform(p, [0.58, 0.64, 0.86, 0.92], [0, 1, 1, 0]);
  const cY = useTransform(p, [0.58, 0.64], ["32px", "0px"]);
  const veil = useTransform(p, [0.9, 1], [0, 1]);
  const progress = useTransform(p, [0, 1], ["scaleY(0)", "scaleY(1)"]);

  useMotionValueEvent(p, "change", (v) => {
    scopeActive.current = v > 0.55 && v < 0.94;
    const s = STEPS.reduce((acc, st, i) => (v >= st.from ? i : acc), 0);
    setStep(s);
  });

  useEffect(() => {
    const canvas = glRef.current;
    if (!canvas) return;
    let scene: RobotScene | null = null;
    let cancelled = false;

    import("../robot/scene")
      .then(({ createRobotScene }) =>
        createRobotScene(canvas, {
          getProgress: () => p.get(),
          labelJoints: LABEL_JOINTS,
          reduceMotion: !!reduce,
          onFrame: ({ frame, frames, labels }) => {
            labels.forEach((l, i) => {
              const el = labelRefs.current[i];
              if (!el) return;
              el.style.transform = `translate3d(${l.x.toFixed(1)}px, ${l.y.toFixed(1)}px, 0)`;
              el.style.opacity = l.on ? "1" : "0";
              const b = el.querySelector("b");
              if (b) b.textContent = `${l.deg >= 0 ? "+" : "−"}${Math.abs(l.deg).toFixed(1)}°`;
            });
            if (frameRef.current) frameRef.current.textContent = `${String(frame).padStart(3, "0")} / ${frames}`;
          },
        }),
      )
      .then((s) => {
        if (cancelled) return s.dispose();
        scene = s;
        const norm = (j: number): Sampler => {
          const [lo, hi] = s.angleRange(j);
          return (t) => ((s.sampleAngle(j, t) - lo) / (hi - lo || 1)) * 1.7 - 0.85;
        };
        source.current = norm(KNEE);
        ghost.current = norm(HIP);
        setStatus("ready");
      })
      .catch(() => !cancelled && setStatus("failed"));

    return () => {
      cancelled = true;
      scene?.dispose();
    };
  }, [p, reduce]);

  return (
    <section className="rh" id="top" ref={sectionRef}>
      <div className="rh-sticky" ref={stickyRef} data-status={status}>
        <div className="rh-bg" />
        <canvas className="rh-gl" ref={glRef} aria-label="MuJoCo에서 기록한 Open Duck Mini v2 보행 롤아웃을 재생하는 3D 장면" />
        {status === "loading" ? <div className="rh-loading mono">loading robot · MuJoCo rollout</div> : null}

        <div className="rh-labels" aria-hidden>
          {LABEL_NAMES.map((n, i) => (
            <div className="jl" key={n} ref={(el) => void (labelRefs.current[i] = el)}>
              <i />
              <span>{n}</span>
              <b className="tabular">0.0°</b>
            </div>
          ))}
        </div>

        {/* 01 — walk */}
        <motion.div className="rh-beat rh-a container" style={{ opacity: aOpacity, y: aY, pointerEvents: aEvents }}>
          <motion.div className="hero-who" {...fade(0.05)}>
            <span className="hero-name">{profile.nameKo}</span>
            <span className="hero-name-en mono">{profile.nameEn}</span>
            <span className="hero-route label">
              Signal <i>→</i> Anomaly <i>→</i> Robot
            </span>
          </motion.div>
          <h1 className="hero-title">
            <span className="sr-only">{profile.nameKo} — </span>
            <RevealLines
              immediate
              delay={0.15}
              stagger={0.1}
              lines={[profile.tagline[0], <span className="hero-hot">{profile.tagline[1]}</span>]}
            />
          </h1>
          <motion.p className="hero-intro" {...fade(0.5)}>
            {profile.intro}
          </motion.p>
          <motion.div className="hero-cta" {...fade(0.62)}>
            <button className="btn btn--solid" onClick={() => scrollToId("bugi")}>
              작업 보기 <ArrowDown />
            </button>
            <a className="btn btn--ghost" href={profile.github} target="_blank" rel="noreferrer">
              <GitHub /> gawbi
            </a>
          </motion.div>
        </motion.div>

        {/* 02 — joints */}
        <motion.div className="rh-beat rh-b" style={{ opacity: bOpacity, y: bY }}>
          <span className="label">
            <b>02</b> Joints · Open Duck Mini v2
          </span>
          <h2>
            다리 관절 10개,
            <br />
            1초에 50번.
          </h2>
          <p>
            공개 보행 정책(ONNX)이 50 Hz로 관절 명령을 내고, MuJoCo가 몸을 움직입니다. 화면의 로봇과 각도는 그 롤아웃에서 기록한 실제
            값입니다.
          </p>
          <p className="rh-note">상상부기가 다리 기구를 빌려 온 바로 그 로봇입니다.</p>
        </motion.div>

        {/* 03 — signal */}
        <motion.div className="rh-beat rh-c" style={{ opacity: cOpacity, y: cY }}>
          <div className="container rh-c-head">
            <span className="label">
              <b>03</b> Signal · joint telemetry
            </span>
            <h2>
              관절 신호를 읽고,
              <br />
              <span className="hero-hot">벗어난 것을 잡는다.</span>
            </h2>
            <p>
              <span className="only-fine">오른쪽 무릎 각도가 흐르는 신호입니다. 커서로 센서 값을 조작해 보세요. 임계값을 넘는 순간 잡아냅니다.</span>
              <span className="only-coarse">오른쪽 무릎 각도가 흐르는 신호입니다. 화면을 눌러 센서 값을 조작해 보세요.</span>
            </p>
          </div>
          <div className="rh-scope">
            <SignalCanvas
              hostRef={stickyRef}
              countRef={countRef}
              timeRef={timeRef}
              source={source}
              ghost={ghost}
              activeRef={scopeActive}
              speed={150}
            />
          </div>
          <div className="container rh-c-hud">
            <span className="label">
              CH1 · R knee <em>/</em> CH2 · R hip_pitch
            </span>
            <span className="hud-right">
              <span className="hud-stat">
                <span className="label">t</span>
                <span className="mono tabular">
                  <span ref={timeRef}>0.0</span>s
                </span>
              </span>
              <span className="hud-stat hud-hot">
                <span className="label">detected</span>
                <span className="mono tabular" ref={countRef}>
                  000
                </span>
              </span>
            </span>
          </div>
        </motion.div>

        {/* instrument chrome */}
        <div className="rh-hud mono" aria-hidden>
          <span>OPEN DUCK MINI V2 · MUJOCO ROLLOUT · APACHE-2.0</span>
          <span>
            frame <span ref={frameRef} className="tabular">000 / 146</span> · 30 fps · 0.096 m/s
          </span>
        </div>

        <div className="rh-steps" aria-hidden>
          <span className="rh-rail">
            <motion.i style={{ transform: progress }} />
          </span>
          <ol>
            {STEPS.map((s, i) => (
              <li key={s.n} data-on={step === i}>
                <span className="mono">{s.n}</span> {s.label}
              </li>
            ))}
          </ol>
        </div>

        <motion.div className="rh-cue mono" style={{ opacity: aOpacity }} aria-hidden>
          scroll — 로봇 안으로 <ArrowDown />
        </motion.div>

        <motion.div className="rh-veil" style={{ opacity: veil }} />
      </div>
    </section>
  );
}
