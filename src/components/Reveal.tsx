import { useEffect, useRef, type ReactNode } from "react";
import { animate, motion, useInView, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";

export const EASE_OUT = [0.23, 1, 0.32, 1] as const;

// The masked children sit outside their overflow box until revealed, so an
// IntersectionObserver on them never fires. Observe the wrapper and let the
// variant propagate down instead.
const masked = {
  hidden: { transform: "translateY(110%)" },
  shown: ({ delay, duration }: { delay: number; duration: number }) => ({
    transform: "translateY(0%)",
    transition: { duration, ease: EASE_OUT, delay },
  }),
};

/** Bars inside overflow-clipped tracks: same trick, the parent observes. */
export const grow = {
  hidden: { transform: "scaleX(0)" },
  shown: ({ to, delay }: { to: number; delay: number }) => ({
    transform: `scaleX(${to})`,
    transition: { duration: 1.3, ease: EASE_OUT, delay },
  }),
};

export const inViewOnce = {
  initial: "hidden",
  whileInView: "shown",
  viewport: { once: true, margin: "-10% 0px" },
} as const;

const trigger = (immediate: boolean) =>
  immediate
    ? { initial: "hidden", animate: "shown" }
    : { initial: "hidden", whileInView: "shown", viewport: { once: true, margin: "-8% 0px" } };

/** Each line slides up out of its own mask. */
export function RevealLines({
  lines,
  className,
  delay = 0,
  stagger = 0.08,
  immediate = false,
}: {
  lines: ReactNode[];
  className?: string;
  delay?: number;
  stagger?: number;
  immediate?: boolean;
}) {
  return (
    <motion.span className={className} style={{ display: "block" }} {...trigger(immediate)}>
      {lines.map((line, i) => (
        <span className="rv-line" key={i}>
          <motion.span className="rv-inner" variants={masked} custom={{ delay: delay + i * stagger, duration: 1.1 }}>
            {line}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}

/** Word-by-word mask reveal, for headings that wrap unpredictably. */
export function RevealWords({ text, delay = 0, stagger = 0.045 }: { text: string; delay?: number; stagger?: number }) {
  const words = text.split(" ");
  return (
    <motion.span style={{ display: "block" }} {...trigger(false)}>
      {words.map((w, i) => (
        <span key={i}>
          <span className="rv-word">
            <motion.span className="rv-inner" variants={masked} custom={{ delay: delay + i * stagger, duration: 0.9 }}>
              {w}
            </motion.span>
          </span>
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </motion.span>
  );
}

export function FadeUp({
  children,
  delay = 0,
  className,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li" | "p" | "figure" | "article";
}) {
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, transform: "translateY(18px)" }}
      whileInView={{ opacity: 1, transform: "translateY(0px)" }}
      viewport={{ once: true, margin: "-6% 0px" }}
      transition={{ duration: 0.8, ease: EASE_OUT, delay }}
    >
      {children}
    </Tag>
  );
}

/** Words light up as the paragraph scrolls through the viewport. */
export function ScrollWords({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.45"] });
  const words = text.split(" ");
  return (
    <p ref={ref} className={className}>
      {words.map((w, i) => (
        <ScrollWord key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]}>
          {w}
        </ScrollWord>
      ))}
    </p>
  );
}

function ScrollWord({ children, progress, range }: { children: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.14, 1]);
  return (
    <>
      <motion.span style={{ opacity }}>{children}</motion.span>{" "}
    </>
  );
}

export function CountUp({ value, decimals = 0, duration = 1.6 }: { value: number; decimals?: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const reduce = useReducedMotion();
  const fmt = (v: number) =>
    v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  useEffect(() => {
    const el = ref.current;
    if (!inView || !el) return;
    if (reduce) {
      el.textContent = fmt(value);
      return;
    }
    const controls = animate(0, value, { duration, ease: EASE_OUT, onUpdate: (v) => (el.textContent = fmt(v)) });
    return () => controls.stop();
  }, [inView]);

  return (
    <span ref={ref} className="tabular">
      {fmt(0)}
    </span>
  );
}

export function SectionHead({
  index,
  label,
  title,
  lede,
}: {
  index: string;
  label: string;
  title: string;
  lede?: string;
}) {
  return (
    <header className="sec-head">
      <FadeUp className="sec-index label">
        <b>{index}</b> {label}
      </FadeUp>
      <h2 className="sec-title">
        <RevealWords text={title} />
      </h2>
      {lede ? (
        <FadeUp className="sec-lede" delay={0.15} as="p">
          {lede}
        </FadeUp>
      ) : null}
    </header>
  );
}
