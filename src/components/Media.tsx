import { useEffect, useRef, type Ref } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { lockScroll } from "../lib/smooth";
import { Close } from "./Icons";
import { EASE_OUT } from "./Reveal";

/** Muted looping clip that only plays while on screen. */
export function LoopVideo({
  src,
  poster,
  className,
  label,
  videoRef,
}: {
  src: string;
  poster: string;
  className?: string;
  label: string;
  videoRef?: Ref<HTMLVideoElement>;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const v = ref.current;
    if (!v || reduce) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.25 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, [reduce]);

  return (
    <video
      ref={(el) => {
        ref.current = el;
        if (typeof videoRef === "function") videoRef(el);
        else if (videoRef) (videoRef as { current: HTMLVideoElement | null }).current = el;
      }}
      className={className}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload="metadata"
      controls={!!reduce}
      aria-label={label}
    />
  );
}

export function VideoModal({
  open,
  onClose,
  src,
  poster,
  title,
}: {
  open: boolean;
  onClose: () => void;
  src: string;
  poster: string;
  title: string;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    lockScroll(true);
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      lockScroll(false);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="modal"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.18 } }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
        >
          <motion.div
            className="modal-frame"
            initial={{ opacity: 0, transform: "scale(0.96)" }}
            animate={{ opacity: 1, transform: "scale(1)" }}
            exit={{ opacity: 0, transform: "scale(0.98)", transition: { duration: 0.16 } }}
            transition={{ duration: 0.4, ease: EASE_OUT }}
            onClick={(e) => e.stopPropagation()}
          >
            <video src={src} poster={poster} controls autoPlay playsInline />
          </motion.div>
          <button ref={closeRef} className="modal-close" onClick={onClose} aria-label="닫기">
            <Close />
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
