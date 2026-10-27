import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { bugi } from "../data";
import { Pause, Play, SoundOff, SoundOn } from "./Icons";
import { LoopVideo, VideoModal } from "./Media";
import { CountUp, EASE_OUT, FadeUp, SectionHead } from "./Reveal";
import "../styles/bugi.css";

const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export function Bugi() {
  const [pitchOpen, setPitchOpen] = useState(false);
  const closePitch = useCallback(() => setPitchOpen(false), []);

  return (
    <section className="section bugi" id="bugi">
      <div className="container">
        <SectionHead index="01" label="Featured · 캡스톤 디자인" title={bugi.title} lede={bugi.summary} />
        <FadeUp className="bugi-goal" delay={0.2}>
          <span className="label">목표</span>
          <p>{bugi.goal}</p>
        </FadeUp>
      </div>

      <PitchExpand onOpen={() => setPitchOpen(true)} />

      <div className="container">
        <ReelStory />
        <Facts />
      </div>

      <VideoModal open={pitchOpen} onClose={closePitch} src={bugi.pitch.src} poster={bugi.pitch.poster} title="상상부기 보고 영상" />
    </section>
  );
}

/* The pitch film grows from a card to full-bleed as you scroll into it. */
function PitchExpand({ onOpen }: { onOpen: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const scale = useTransform(scrollYProgress, [0, 0.62], [0.56, 1]);
  const radius = useTransform(scrollYProgress, [0, 0.62], [36, 0]);
  const captionOpacity = useTransform(scrollYProgress, [0.45, 0.66], [0, 1]);

  return (
    <div className="pitch" ref={ref}>
      <div className="pitch-sticky">
        <motion.div className="pitch-media" style={{ scale, borderRadius: radius }}>
          <LoopVideo src={bugi.pitch.src} poster={bugi.pitch.poster} label="상상부기 보고 영상 (소리 없이 반복 재생)" />
          <div className="pitch-shade" />
          <span className="media-copy">{bugi.copyright}</span>
          <motion.div className="pitch-caption container" style={{ opacity: captionOpacity }}>
            <div className="label">Pitch film · 내레이션 + 배경음악 · 2분</div>
            <button className="btn btn--solid pitch-play" onClick={onOpen}>
              <Play /> 소리와 함께 보기 <span className="mono pitch-len">{bugi.pitch.length}</span>
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

/* Vertical reel on the left, story beats synced to its timeline on the right. */
function ReelStory() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const barRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    let raf = 0;
    let last = -1;
    const update = () => {
      const t = v.currentTime;
      let i = 0;
      bugi.beats.forEach((b, k) => t >= b.start && (i = k));
      if (i !== last) {
        last = i;
        setActive(i);
      }
      bugi.beats.forEach((b, k) => {
        const el = barRefs.current[k];
        if (!el) return;
        const p = k < i ? 1 : k > i ? 0 : Math.min(1, Math.max(0, (t - b.start) / (b.end - b.start)));
        el.style.transform = `scaleX(${p})`;
      });
    };
    const loop = () => {
      update();
      raf = requestAnimationFrame(loop);
    };
    const onPlay = () => {
      setPlaying(true);
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
    };
    const onPause = () => {
      setPlaying(false);
      cancelAnimationFrame(raf);
    };
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("seeked", update);
    return () => {
      cancelAnimationFrame(raf);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("seeked", update);
    };
  }, []);

  const seek = (i: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = bugi.beats[i].start + 0.05;
    v.play().catch(() => {});
  };

  const toggleSound = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
    if (!v.muted) v.play().catch(() => {});
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    v.paused ? v.play().catch(() => {}) : v.pause();
  };

  return (
    <div className="reel">
      <div className="reel-phone-wrap">
        <FadeUp className="reel-phone">
          <LoopVideo videoRef={videoRef} src={bugi.reel.src} poster={bugi.reel.poster} label="상상부기 로봇 만들기 Day 1 릴스" />
          <div className="reel-controls">
            <button className="reel-btn" onClick={togglePlay} aria-label={playing ? "일시정지" : "재생"}>
              {playing ? <Pause /> : <Play />}
            </button>
            <button className="reel-btn" onClick={toggleSound} aria-label={muted ? "소리 켜기" : "소리 끄기"}>
              {muted ? <SoundOff /> : <SoundOn />}
              <span>{muted ? "소리 켜기" : "소리 끄기"}</span>
            </button>
          </div>
        </FadeUp>
        <p className="reel-cap label">
          Reel · Day 1 설계 &amp; 시뮬레이션 · 50s · <span className="reel-copy">{bugi.copyright}</span>
        </p>
      </div>

      <div className="reel-beats">
        <FadeUp className="reel-intro">
          <h3>하루 만에 넘어지고, 다시 세우고, 걷게 하기까지</h3>
          <p>항목을 누르면 그 장면으로 이동합니다.</p>
        </FadeUp>
        <ol>
          {bugi.beats.map((b, i) => (
            <FadeUp as="li" key={b.start} delay={i * 0.04}>
              <button className="beat" data-active={active === i} onClick={() => seek(i)}>
                <span className="beat-time mono tabular">{mmss(b.start)}</span>
                <span className="beat-main">
                  <span className="beat-title">{b.title}</span>
                  <span className="beat-body">{b.body}</span>
                </span>
                <span className="beat-bar" aria-hidden>
                  <span ref={(el) => void (barRefs.current[i] = el)} />
                </span>
              </button>
            </FadeUp>
          ))}
        </ol>
      </div>
    </div>
  );
}

function Facts() {
  const doneUntil = bugi.stages.findIndex((s) => s.state === "next");
  return (
    <div className="bugi-facts">
      <div className="specs">
        {bugi.specs.map((s, i) => (
          <FadeUp className="spec" key={s.label} delay={i * 0.06}>
            <div className="spec-v">
              {s.prefix ? <span className="spec-pre">{s.prefix}</span> : null}
              <CountUp value={s.value} />
              <span className="spec-u">{s.unit}</span>
            </div>
            <div className="label">{s.label}</div>
          </FadeUp>
        ))}
      </div>

      <FadeUp className="stages">
        <div className="stages-head">
          <span className="label">진행 단계</span>
          <span className="stages-now mono">지금: 준비 기간 (설계와 시뮬레이션) · 캡스톤 수업은 다음 학기</span>
        </div>
        <ol className="stages-track">
          <motion.span
            className="stages-fill"
            initial={{ transform: "scaleX(0)" }}
            whileInView={{ transform: `scaleX(${(doneUntil - 0.5) / (bugi.stages.length - 1)})` }}
            viewport={{ once: true }}
            transition={{ duration: 1.4, ease: EASE_OUT, delay: 0.2 }}
          />
          {bugi.stages.map((s) => (
            <li key={s.n} className="stage" data-state={s.state}>
              <span className="stage-dot mono">{s.n}</span>
              <span className="stage-label">{s.label}</span>
              <span className="stage-state mono">
                {s.state === "done" ? "완료" : s.state === "tentative" ? "잠정 확정" : s.state === "next" ? "다음" : ""}
              </span>
            </li>
          ))}
        </ol>
      </FadeUp>

      <FadeUp className="bugi-foot">
        <div className="bugi-stack">
          {bugi.stack.map((s) => (
            <span className="chip" key={s}>
              {s}
            </span>
          ))}
        </div>
        <p className="bugi-disclaimer">
          <strong>{bugi.copyright}</strong> {bugi.disclaimer} <span className="mono">— {bugi.team} · 김광빈</span>
        </p>
      </FadeUp>
    </div>
  );
}
