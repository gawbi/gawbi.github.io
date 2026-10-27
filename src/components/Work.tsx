import { useRef, type PointerEvent } from "react";
import { legacy, projects, type Project } from "../data";
import { ArrowUpRight } from "./Icons";
import { LoopVideo } from "./Media";
import { FadeUp, SectionHead } from "./Reveal";
import { ArmViz } from "./visuals/Arm";
import { F1Bars } from "./visuals/F1Bars";
import { SpectroViz } from "./visuals/Spectro";
import { ThresholdLabels, ThresholdViz } from "./visuals/Threshold";
import "../styles/work.css";

export function Work() {
  return (
    <section className="section work" id="work">
      <div className="container">
        <SectionHead
          index="03"
          label="Selected work · 신호 · 이상탐지 · 비전"
          title="숫자를 받으면, 그 숫자부터 의심합니다"
          lede="이전 프로젝트들입니다. 결과 옆에는 늘 조건과 한계를 같이 적었습니다 — 어떤 데이터에서, 시드 몇 개로, 무엇과 비교했는지."
        />
        <div className="bento">
          {projects.map((p, i) => (
            <Card key={p.id} p={p} index={i} />
          ))}
        </div>
        <FadeUp>
          <a className="legacy" href={legacy.href} target="_blank" rel="noreferrer">
            <span className="mono legacy-name">{legacy.name}</span>
            <span className="legacy-body">{legacy.body}</span>
            <ArrowUpRight />
          </a>
        </FadeUp>
      </div>
    </section>
  );
}

function Card({ p, index }: { p: Project; index: number }) {
  const ref = useRef<HTMLElement>(null);

  const onMove = (e: PointerEvent<HTMLElement>) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <FadeUp className={`card card--${p.size} card--${p.id}`} delay={(index % 2) * 0.08}>
      <article ref={ref} className="card-inner" onPointerMove={onMove}>
        <a className="card-hit" href={p.href} target="_blank" rel="noreferrer" aria-label={`${p.name} 저장소 열기`} />
        <div className="card-visual">
          <Visual p={p} hostRef={ref} />
        </div>
        <div className="card-body">
          <div className="card-kicker label">{p.kicker}</div>
          <h3 className="card-title">{p.headline}</h3>
          <p className="card-text">{p.body}</p>
          {p.metric ? (
            <div className="metric">
              <div className="metric-v">
                <span className="tabular">{p.metric.value}</span>
                {p.metric.unit ? <span className="metric-u">{p.metric.unit}</span> : null}
              </div>
              <div className="metric-l">{p.metric.label}</div>
            </div>
          ) : null}
          {p.note ? <p className="card-note mono">{p.note}</p> : null}
          <div className="card-foot">
            <div className="card-tags">
              {p.tags.map((t) => (
                <span className="chip" key={t}>
                  {t}
                </span>
              ))}
            </div>
            <div className="card-links">
              {p.live ? (
                <a className="card-live" href={p.live} target="_blank" rel="noreferrer">
                  <i /> Live <ArrowUpRight />
                </a>
              ) : null}
              <span className="arrow-link card-repo">
                {p.name} <ArrowUpRight />
              </span>
            </div>
          </div>
        </div>
      </article>
    </FadeUp>
  );
}

function Visual({ p, hostRef }: { p: Project; hostRef: React.RefObject<HTMLElement | null> }) {
  if (p.video) return <LoopVideo src={p.video.src} poster={p.video.poster} label={`${p.name} 미리보기`} />;
  if (p.image) return <img src={p.image} alt="" loading="lazy" decoding="async" />;
  switch (p.visual) {
    case "threshold":
      return (
        <>
          <ThresholdViz />
          <ThresholdLabels />
        </>
      );
    case "bars":
      return <F1Bars />;
    case "spectro":
      return <SpectroViz />;
    case "arm":
      return <ArmViz hostRef={hostRef} />;
    default:
      return null;
  }
}
