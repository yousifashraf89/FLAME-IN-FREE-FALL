import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { WarningOctagon, Warning, WarningCircle, CheckCircle } from "@phosphor-icons/react";

export function Card({ children, className = "", inner = "p-5", delay = 0 }: { children: ReactNode; className?: string; inner?: string; delay?: number }) {
  return (
    <div className={`shell reveal min-w-0 ${className}`} style={{ animationDelay: `${delay}ms` }}>
      <div className={`core ${inner}`}>{children}</div>
    </div>
  );
}

export function SectionHead({ id, title, lede }: { id: string; title: ReactNode; lede: ReactNode }) {
  return (
    <div id={id} className="mb-5 max-w-3xl scroll-mt-20">
      <h2 className="text-[20px] font-semibold leading-tight tracking-[-0.015em] text-ink [text-wrap:balance]">{title}</h2>
      <p className="mt-1.5 max-w-[68ch] text-[13.5px] leading-relaxed text-ink-2">{lede}</p>
    </div>
  );
}

// cols: lay options out as an equal-width grid (for narrow sidebars) instead of a pill row.
// The active option is marked by one indicator that slides between options.
export function Segmented<T extends string>({ value, options, onChange, size = "md", cols }: { value: T; options: { value: T; label: ReactNode }[]; onChange: (v: T) => void; size?: "xs" | "sm" | "md"; cols?: number }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const measure = () => {
      const b = el.querySelector<HTMLElement>('[aria-pressed="true"]');
      setBox(b ? { x: b.offsetLeft, y: b.offsetTop, w: b.offsetWidth, h: b.offsetHeight } : null);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [value, options.length]);
  const pad = size === "xs" ? "p-0.5" : "p-1";
  const btn = size === "xs" ? "h-7 px-3 text-[12px]" : size === "sm" ? "py-1.5 text-xs" : "py-2 text-[13px]";
  return (
    <div
      ref={wrap}
      role="group"
      className={`relative gap-1 bg-white/[0.04] ring-1 ring-white/[0.07] ${pad} ${cols ? "grid w-full rounded-2xl" : "inline-flex max-w-full overflow-x-auto rounded-full [scrollbar-width:none]"}`}
      style={cols ? { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` } : undefined}
    >
      {box && (
        <span
          aria-hidden
          className={`pointer-events-none absolute bg-ink shadow-[0_6px_20px_-8px_rgba(255,255,255,0.45)] transition-all duration-500 ease-spring ${cols ? "rounded-xl" : "rounded-full"}`}
          style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
        />
      )}
      {options.map((o) => (
        <button
          key={o.value}
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`relative z-[1] inline-flex items-center justify-center gap-1 whitespace-nowrap font-medium transition-colors duration-300 active:scale-[0.97] ${btn} ${cols ? "rounded-xl px-2" : size === "md" ? "rounded-full px-4" : "rounded-full px-3"} ${
            value === o.value ? "text-bg" : "text-ink-2 hover:text-ink"
          } ${value === o.value && !box ? "bg-ink" : ""}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Animates the first number inside `value` (keeps prefix/suffix, decimals and thousands separators). */
export function CountUp({ value, duration = 700, delay = 0 }: { value: string | number; duration?: number; delay?: number }) {
  const str = String(value);
  const m = str.match(/\d[\d,]*(\.\d+)?/);
  const target = m ? parseFloat(m[0].replace(/,/g, "")) : 0;
  const dec = m?.[1] ? m[1].length - 1 : 0;
  const comma = !!m && m[0].includes(",");
  const shown = useRef(0);
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!m) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const from = shown.current;
    if (reduce || from === target) {
      shown.current = target;
      setN(target);
      return;
    }
    let raf = 0;
    let start = 0;
    const tick = (now: number) => {
      if (!start) start = now + delay;
      const k = Math.min(1, Math.max(0, (now - start) / duration));
      const eased = 1 - Math.pow(2, -10 * k); // ease-out expo
      const v = from + (target - from) * (k === 1 ? 1 : eased);
      shown.current = v;
      setN(v);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  if (!m) return <>{str}</>;
  const num = comma ? n.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec }) : n.toFixed(dec);
  return (
    <span className="tabular-nums">
      {str.slice(0, m.index)}
      {num}
      {str.slice(m.index! + m[0].length)}
    </span>
  );
}

/** false on first paint, true right after: lets widths/heights animate in from zero on mount. */
export function useEntered(delay = 60) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setOn(true), delay);
    return () => clearTimeout(id);
  }, []);
  return on;
}

export function Chip({ children, onClick, active, text }: { children: ReactNode; onClick?: () => void; active?: boolean; text?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`${text ? "" : "num "}rounded-full px-2.5 py-1 text-[12px] ring-1 transition-all duration-300 ease-spring active:scale-[0.97] ${
        active ? "bg-ug/15 text-ug ring-ug/30" : "bg-white/[0.04] text-ink-2 ring-white/[0.08] hover:bg-white/[0.08] hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

const TONES = {
  critical: { c: "text-critical bg-critical/10 ring-critical/25", Icon: WarningOctagon, label: "Critical gap" },
  serious: { c: "text-serious bg-serious/10 ring-serious/25", Icon: Warning, label: "Serious" },
  warning: { c: "text-warning bg-warning/10 ring-warning/25", Icon: WarningCircle, label: "Watch" },
  good: { c: "text-good bg-good/10 ring-good/25", Icon: CheckCircle, label: "Covered" },
};
export function Status({ tone }: { tone: keyof typeof TONES }) {
  const t = TONES[tone];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-[12px] font-medium ring-1 ${t.c}`}>
      <t.Icon size={13} weight="light" />
      {t.label}
    </span>
  );
}

export function Meter({ value, max = 5, color = "#6aa8ff" }: { value: number; max?: number; color?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full rounded-full transition-all duration-700 ease-spring" style={{ width: `${(value / max) * 100}%`, background: color }} />
      </div>
      <span className="num w-7 text-right text-[12px] text-ink-2">{value.toFixed(1)}</span>
    </div>
  );
}

/** Styled native slider (keyboard and screen readers work as usual). ticks: dots at each step, for coarse scales. */
export function Range({ value, min, max, step = 1, onChange, ticks, color, className = "", ...rest }: { value: number; min: number; max: number; step?: number; onChange: (v: number) => void; ticks?: boolean; color?: string; className?: string; id?: string; "aria-label"?: string }) {
  const p = ((Math.min(max, Math.max(min, value)) - min) / (max - min)) * 100;
  return (
    <div className={`relative ${className}`}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="range relative z-[1] block"
        style={{ "--p": `${p}%`, ...(color ? { "--fill": color } : {}) } as CSSProperties}
        {...rest}
      />
      {ticks && (
        <div aria-hidden className="pointer-events-none absolute inset-x-[9px] top-1/2 z-[2] flex -translate-y-1/2 justify-between">
          {Array.from({ length: Math.round((max - min) / step) + 1 }, (_, i) => (
            <span key={i} className={`h-1 w-1 rounded-full ${min + i * step === value ? "opacity-0" : min + i * step < value ? "bg-bg/50" : "bg-white/25"}`} />
          ))}
        </div>
      )}
    </div>
  );
}
