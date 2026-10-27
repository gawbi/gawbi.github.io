import { useRef } from "react";
import { motion } from "motion/react";
import { profile } from "../data";
import { scrollToId } from "../lib/smooth";
import { ArrowDown, GitHub } from "./Icons";
import { EASE_OUT, RevealLines } from "./Reveal";
import { SignalCanvas } from "./SignalCanvas";
import "../styles/hero.css";

const fade = (delay: number) => ({
  initial: { opacity: 0, transform: "translateY(12px)" },
  animate: { opacity: 1, transform: "translateY(0px)" },
  transition: { duration: 0.9, ease: EASE_OUT, delay },
});

export function Hero() {
  const hostRef = useRef<HTMLElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);

  return (
    <section className="hero" ref={hostRef} id="top">
      <div className="container hero-inner">
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
      </div>

      <div className="hero-scope">
        <SignalCanvas hostRef={hostRef} countRef={countRef} timeRef={timeRef} />
      </div>

      <motion.div className="hero-hud container" {...fade(0.9)}>
        <div className="hud-cell">
          <span className="label">CH1 · live</span>
          <span className="hud-hint">
            <span className="only-fine">커서로 신호를 흔들어 보세요. 임계값을 넘는 순간 잡아냅니다.</span>
            <span className="only-coarse">화면을 눌러 신호를 흔들어 보세요.</span>
          </span>
        </div>
        <div className="hud-cell hud-right">
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
        </div>
      </motion.div>
    </section>
  );
}
