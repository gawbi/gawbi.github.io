import { motion } from "motion/react";
import { humanoid, nextUp } from "../data";
import { ArrowUpRight } from "./Icons";
import { LoopVideo } from "./Media";
import { CountUp, FadeUp, grow, inViewOnce, SectionHead } from "./Reveal";
import "../styles/humanoid.css";

export function Humanoid() {
  const { ablation } = humanoid;
  return (
    <section className="section humanoid" id="humanoid">
      <div className="container">
        <SectionHead index="02" label="Now · 휴머노이드 강화학습" title="로봇이 걷는 법을 가르칩니다" lede={humanoid.summary} />

        <div className="hum-grid">
          <FadeUp as="figure" className="viewport">
            <LoopVideo src={humanoid.baseline.src} poster={humanoid.baseline.poster} label="Isaac Lab에서 PPO로 학습한 Unitree G1 평지 보행" />
            <figcaption className="viewport-hud">
              <span className="label">Isaac Lab · Unitree G1 · RSL-RL PPO</span>
              <span className="viewport-rec mono">
                <i /> 실험 0 · 기본 보상
              </span>
            </figcaption>
            <span className="corner tl" />
            <span className="corner tr" />
            <span className="corner bl" />
            <span className="corner br" />
          </FadeUp>

          <div className="hum-stats">
            {humanoid.stats.map((s, i) => (
              <FadeUp className="hum-stat" key={s.label} delay={i * 0.06}>
                <div className="hum-stat-v">
                  <CountUp value={s.value} decimals={s.decimals ?? 0} />
                  <span>{s.unit}</span>
                </div>
                <div className="hum-stat-l">{s.label}</div>
              </FadeUp>
            ))}
            <FadeUp className="hum-links" delay={0.2}>
              <a className="arrow-link" href={humanoid.repo} target="_blank" rel="noreferrer">
                robotics-rl-study <ArrowUpRight />
              </a>
            </FadeUp>
          </div>
        </div>

        <div className="ablation">
          <FadeUp className="abl-head">
            <span className="label">Reward ablation · day5</span>
            <h3>{ablation.title}</h3>
            <p className="abl-setup mono">{ablation.setup}</p>
          </FadeUp>

          <FadeUp as="figure" className="abl-video">
            <LoopVideo src={humanoid.versus.src} poster={humanoid.versus.poster} label="왼쪽 실험 0 기본 보상, 오른쪽 실험 1 feet_air_time = 0. 같은 명령으로 걷는 두 정책 비교" />
          </FadeUp>

          <div className="abl-table" role="table" aria-label="실험 0과 실험 1 비교">
            <div className="abl-legend" role="row">
              <span role="columnheader" className="label">지표</span>
              <span role="columnheader" className="abl-key">
                <i className="sw sw-a" /> 실험 0 · 기본
                <i className="sw sw-b" /> 실험 1 · feet_air_time = 0
              </span>
              <span role="columnheader" className="label abl-verdict-h">판정</span>
            </div>
            {ablation.rows.map((r, i) => (
              <FadeUp className="abl-row" key={r.key} delay={i * 0.08}>
                <div className="abl-label">
                  <span>{r.label}</span>
                  <code className="mono">{r.key}</code>
                </div>
                <motion.div className="abl-bars" {...inViewOnce}>
                  {([
                    ["a", r.a],
                    ["b", r.b],
                  ] as const).map(([k, v], j) => (
                    <div className="abl-bar-row" key={k}>
                      <span className="abl-track">
                        <motion.span
                          className={`abl-bar abl-bar-${k}`}
                          data-flag={k === "b" && r.flag ? "true" : undefined}
                          variants={grow}
                          custom={{ to: v / r.max, delay: 0.15 + i * 0.12 + j * 0.1 }}
                        />
                      </span>
                      <span className="abl-val mono tabular" data-flag={k === "b" && r.flag ? "true" : undefined}>
                        {r.fmt(v)}
                      </span>
                    </div>
                  ))}
                </motion.div>
                <div className="abl-verdict" data-flag={r.flag ? "true" : undefined}>
                  {r.verdict}
                </div>
              </FadeUp>
            ))}
          </div>

          <FadeUp className="abl-take">
            <p>{ablation.takeaway}</p>
            <p className="abl-caveat">
              <span className="chip">seed × 1</span> {ablation.caveat}{" "}
              <a className="arrow-link" href={humanoid.notes} target="_blank" rel="noreferrer">
                notes.md <ArrowUpRight />
              </a>
            </p>
          </FadeUp>
        </div>

        <div className="direction">
          <FadeUp className="direction-head">
            <span className="label">지금 향하는 곳</span>
          </FadeUp>
          <div className="direction-grid">
            {humanoid.direction.map((d, i) => (
              <FadeUp className="direction-card" key={d.title} delay={i * 0.07}>
                <span className="direction-n mono">0{i + 1}</span>
                <h4>{d.title}</h4>
                <p>{d.body}</p>
                {"href" in d && d.href ? (
                  <a className="arrow-link" href={d.href} target="_blank" rel="noreferrer">
                    저장소 <ArrowUpRight />
                  </a>
                ) : null}
              </FadeUp>
            ))}
          </div>
          <FadeUp className="next-up">
            <span className="label">다음에 보려는 것 · 아직 저장소에 코드가 없습니다</span>
            <ul>
              {nextUp.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
