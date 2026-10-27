import { useEffect, useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { nav, profile } from "../data";
import { scrollToId } from "../lib/smooth";
import { GitHub } from "./Icons";
import "../styles/nav.css";

export function Nav() {
  const { scrollY } = useScroll();
  const [solid, setSolid] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setSolid(y > 24);
    setHidden(y > 640 && y > prev + 2);
    if (y < prev - 2) setHidden(false);
    // the hero is a tall pinned scene, so "top" is anything above the first section
    const first = document.getElementById(nav[0].id);
    if (first && y < first.offsetTop - window.innerHeight * 0.5) setActive(null);
  });

  useEffect(() => {
    const els = nav.map((n) => document.getElementById(n.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <header className="nav" data-solid={solid} data-hidden={hidden}>
      <div className="container nav-inner">
        <button className="nav-mark" onClick={() => scrollToId("top")} aria-label="맨 위로">
          <svg viewBox="0 0 32 32" aria-hidden>
            <path d="M3 20h6l3-6 3 8 3-16 3 14h8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
            <circle cx="18" cy="6" r="2.6" fill="var(--anomaly)" />
          </svg>
          <span>{profile.nameKo}</span>
        </button>

        <nav className="nav-links" aria-label="섹션">
          {nav.map((n) => (
            <button key={n.id} className="nav-link" data-active={active === n.id} onClick={() => scrollToId(n.id)}>
              {active === n.id ? (
                <motion.span layoutId="nav-pill" className="nav-pill" transition={{ type: "spring", duration: 0.45, bounce: 0.15 }} />
              ) : null}
              <span className="nav-text">{n.label}</span>
            </button>
          ))}
        </nav>

        <a className="nav-gh" href={profile.github} target="_blank" rel="noreferrer" aria-label="GitHub">
          <GitHub />
        </a>
      </div>
    </header>
  );
}
