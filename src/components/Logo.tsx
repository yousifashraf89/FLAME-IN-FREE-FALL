// Mark: the round NASA Space Apps Challenge symbol, cut from the official logo (public/spaceapps-logo.png).
// public/favicon-*.png use the same mark on a dark tile.
export function LogoMark({ size = 24, className = "" }: { size?: number; className?: string }) {
  return <img src="/spaceapps-mark.png" width={size} height={size} alt="" aria-hidden className={`object-contain ${className}`} />;
}
