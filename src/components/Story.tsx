import { motion } from "motion/react";
import { path, principles, privateWork, profile, tools } from "../data";
import { scrollToId } from "../lib/smooth";
import { ArrowUpRight, GitHub, Lock } from "./Icons";
import { EASE_OUT, FadeUp, RevealLines, ScrollWords, SectionHead } from "./Reveal";
import "../styles/story.css";

export function Principles() {
  return (
    <section className="section principles" id="principles">
      <div className="container">
        <FadeUp className="sec-index label">
          <b>04</b> How I work · 일하는 방식
        </FadeUp>
        <ScrollWords className="statement" text={principles.statement} />
        <ol className="receipts">
          {principles.receipts.map((r, i) => (
            <FadeUp as="li" className="receipt" key={r.tag} delay={i * 0.05}>
              <span className="receipt-n mono">R-{String(i + 1).padStart(2, "0")}</span>
              <span className="receipt-tag">{r.tag}</span>
              <p className="receipt-what">{r.what}</p>
              <span className="receipt-where mono">{r.where}</span>
            </FadeUp>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function PrivateWork() {
  return (
    <section className="section private" id="private">
      <div className="container">
        <SectionHead index="05" label="Private · 코드 비공개" title="올릴 수 없는 작업들" lede={privateWork.intro} />
        <div className="pv-list">
          {privateWork.rows.map((r, i) => (
            <FadeUp className="pv-row" key={r.title} delay={i * 0.05}>
              <span className="pv-period mono">{r.period}</span>
              <div className="pv-main">
                <h3>{r.title}</h3>
                <p>{r.what}</p>
              </div>
              <span className="pv-why">
                <Lock />
                {r.why}
              </span>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

const channels: Record<(typeof path)[number]["channel"], { d: string; hot?: string }> = {
  flat: { d: "M0,40 H22 V16 H52 V40 H82 V16 H112 V40 H142 V16 H172 V40 H200" },
  wave: {
    d: "M0,30 C10,10 20,10 30,30 S50,50 60,30 S80,8 92,30 S112,48 124,30 S146,12 158,30 S180,46 200,30",
  },
  spike: { d: "M0,38 L40,36 L60,39 L80,37 L92,38 L100,6 L108,38 L130,36 L160,39 L200,37", hot: "M96,22 L100,6 L104,22" },
  gait: { d: "M0,18 H30 V40 H70 V18 H110 V40 H150 V18 H190 V40 H200", hot: "M0,40 H30 V18 H70 V40 H110 V18 H150 V40 H190 V18 H200" },
};

export function Path() {
  return (
    <section className="section pathsec" id="path">
      <div className="container">
        <SectionHead index="06" label="Path · 지나온 길" title="스펙트럼에서 걸음까지" />
        <ol className="path">
          {path.map((p, i) => {
            const ch = channels[p.channel];
            return (
              <FadeUp as="li" className="path-step" key={p.when} delay={i * 0.1}>
                <svg viewBox="0 0 200 48" className="path-ch" data-ch={p.channel} aria-hidden>
                  <line x1="0" x2="200" y1="46" y2="46" className="path-axis" />
                  <motion.path
                    d={ch.d}
                    className="path-trace"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true, margin: "-10% 0px" }}
                    transition={{ duration: 1.4, ease: EASE_OUT, delay: 0.2 + i * 0.18 }}
                  />
                  {ch.hot ? (
                    <motion.path
                      d={ch.hot}
                      className={p.channel === "gait" ? "path-trace path-trace-2" : "path-hot"}
                      initial={{ pathLength: 0 }}
                      whileInView={{ pathLength: 1 }}
                      viewport={{ once: true, margin: "-10% 0px" }}
                      transition={{ duration: 1.4, ease: EASE_OUT, delay: 0.4 + i * 0.18 }}
                    />
                  ) : null}
                </svg>
                <span className="path-when mono" data-now={p.when === "NOW"}>
                  {p.when}
                </span>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </FadeUp>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

export function Outro() {
  const row = [...tools, ...tools];
  return (
    <section className="outro" id="contact">
      <div className="marquee" aria-label="다뤄 본 도구">
        <div className="marquee-track">
          {row.map((t, i) => (
            <span className="marquee-item" key={i} aria-hidden={i >= tools.length}>
              {t}
              <svg viewBox="0 0 20 10" aria-hidden>
                <path d="M0 5h5l2-4 3 8 2-4h8" />
              </svg>
            </span>
          ))}
        </div>
      </div>

      <div className="container outro-main">
        <FadeUp className="sec-index label">
          <b>07</b> Contact
        </FadeUp>
        <h2 className="outro-title">
          <RevealLines lines={["Robot Learning\u00a0· Manipulation", "직무를 준비하고 있습니다."]} />
        </h2>
        <FadeUp className="outro-sub" as="p" delay={0.2}>
          코드와 실험 기록, 실패한 시도까지 모두 GitHub에 남겨 두었습니다.
        </FadeUp>
        <FadeUp className="outro-cta" delay={0.28}>
          <a className="btn btn--solid" href={profile.github} target="_blank" rel="noreferrer">
            <GitHub /> github.com/gawbi <ArrowUpRight />
          </a>
          {profile.email ? (
            <a className="btn btn--ghost" href={`mailto:${profile.email}`}>
              {profile.email}
            </a>
          ) : null}
        </FadeUp>
      </div>

      <footer className="container footer">
        <span>
          © 2026 {profile.nameKo} <span className="footer-credit">· 상상부기 캐릭터 · 로고 · 캠퍼스 사진 © 한성대학교</span>
        </span>
        <span className="mono footer-route">Signal → Anomaly → Robot</span>
        <button className="arrow-link" onClick={() => scrollToId("top")}>
          맨 위로 ↑
        </button>
      </footer>

      <div className="footer-name" aria-hidden>
        <span>GWANGBIN KIM</span>
      </div>
    </section>
  );
}
