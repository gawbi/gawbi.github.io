type P = { className?: string };

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const ArrowUpRight = ({ className }: P) => (
  <svg viewBox="0 0 16 16" className={className} {...base}>
    <path d="M5 11 11 5M6 5h5v5" />
  </svg>
);

export const ArrowDown = ({ className }: P) => (
  <svg viewBox="0 0 16 16" className={className} {...base}>
    <path d="M8 3v10M4 9l4 4 4-4" />
  </svg>
);

export const Play = ({ className }: P) => (
  <svg viewBox="0 0 16 16" className={className} aria-hidden>
    <path d="M5 3.2v9.6a.6.6 0 0 0 .9.5l7.6-4.8a.6.6 0 0 0 0-1L5.9 2.7a.6.6 0 0 0-.9.5Z" fill="currentColor" />
  </svg>
);

export const Pause = ({ className }: P) => (
  <svg viewBox="0 0 16 16" className={className} aria-hidden>
    <rect x="4" y="3" width="2.6" height="10" rx="0.8" fill="currentColor" />
    <rect x="9.4" y="3" width="2.6" height="10" rx="0.8" fill="currentColor" />
  </svg>
);

export const SoundOn = ({ className }: P) => (
  <svg viewBox="0 0 16 16" className={className} {...base}>
    <path d="M2.5 6v4h2.5l3.5 3V3L5 6H2.5ZM11 5.5a3.5 3.5 0 0 1 0 5M12.8 3.6a6 6 0 0 1 0 8.8" />
  </svg>
);

export const SoundOff = ({ className }: P) => (
  <svg viewBox="0 0 16 16" className={className} {...base}>
    <path d="M2.5 6v4h2.5l3.5 3V3L5 6H2.5ZM11 6.2l3.4 3.6M14.4 6.2 11 9.8" />
  </svg>
);

export const Lock = ({ className }: P) => (
  <svg viewBox="0 0 16 16" className={className} {...base}>
    <rect x="3" y="7" width="10" height="7" rx="1.6" />
    <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
  </svg>
);

export const Close = ({ className }: P) => (
  <svg viewBox="0 0 16 16" className={className} {...base}>
    <path d="m4 4 8 8M12 4l-8 8" />
  </svg>
);

export const GitHub = ({ className }: P) => (
  <svg viewBox="0 0 16 16" className={className} aria-hidden>
    <path
      fill="currentColor"
      d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
    />
  </svg>
);
