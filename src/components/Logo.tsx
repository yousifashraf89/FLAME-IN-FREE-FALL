import { useId } from "react";

// Mark: a spherical microgravity flame (blue front, orange fuel droplet) wrapped by an orbit ring.
// public/flame.svg is the same artwork on a dark tile, used as the favicon.
export function LogoMark({ size = 24, className = "" }: { size?: number; className?: string }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden>
      <defs>
        <radialGradient id={`${id}s`} cx="50%" cy="50%" r="50%">
          <stop offset="0.45" stopColor="#3987e5" stopOpacity="0" />
          <stop offset="0.85" stopColor="#6aa8ff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#3987e5" stopOpacity="0.1" />
        </radialGradient>
        <radialGradient id={`${id}d`} cx="40%" cy="38%" r="65%">
          <stop offset="0" stopColor="#ffd27a" />
          <stop offset="1" stopColor="#e2611f" />
        </radialGradient>
      </defs>
      <g transform="translate(16 16) rotate(-25)">
        <path d="M-14.5 0 A14.5 4.5 0 0 1 14.5 0" fill="none" stroke="#a9b3c6" strokeOpacity="0.35" strokeWidth="1.3" strokeLinecap="round" />
      </g>
      <circle cx="16" cy="16" r="10.5" fill={`url(#${id}s)`} className="logo-breathe" />
      <circle cx="16" cy="16" r="10" fill="none" stroke="#6aa8ff" strokeWidth="1.6" />
      <circle cx="16" cy="16" r="3.4" fill={`url(#${id}d)`} className="logo-core" />
      <g transform="translate(16 16) rotate(-25)">
        <path d="M14.5 0 A14.5 4.5 0 0 1 -14.5 0" fill="none" stroke="#e8edf5" strokeWidth="1.5" strokeLinecap="round" />
      </g>
    </svg>
  );
}
