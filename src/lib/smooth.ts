import Lenis from "lenis";

let lenis: Lenis | null = null;

export function initSmoothScroll() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};

  lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  let raf = requestAnimationFrame(function loop(t) {
    lenis?.raf(t);
    raf = requestAnimationFrame(loop);
  });

  return () => {
    cancelAnimationFrame(raf);
    lenis?.destroy();
    lenis = null;
  };
}

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset: -8 });
  else el.scrollIntoView({ behavior: "smooth" });
}

export function lockScroll(locked: boolean) {
  if (lenis) locked ? lenis.stop() : lenis.start();
  document.documentElement.style.overflow = locked ? "hidden" : "";
}
