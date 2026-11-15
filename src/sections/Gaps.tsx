import { ArrowUpRight, Check, X } from "@phosphor-icons/react";
import { SPINOFFS } from "../data/ai";
import { TOTALS } from "../lib/data";
import { Card, SectionHead } from "../components/ui";

// x is the real gravity level, so spacing on the axis is proportional
const GRAVITY = [
  { g: "0 g", v: 0, name: "Microgravity", has: true, text: `${TOTALS.flight} ISS & Cygnus flight investigations` },
  { g: "0.16 g", v: 0.16, name: "Moon", has: false, text: "No data yet. LUCI & FM2 are planned" },
  { g: "0.38 g", v: 0.38, name: "Mars", has: false, text: "No data" },
  { g: "1 g", v: 1, name: "Earth", has: true, text: "Ground studies & 1-g reference burns" },
];

const NEXT = [
  { t: "Burn real cabin materials at 26.5–34 % O₂ and 8.2–10.2 psi", w: "Fills the biggest gap on the habitat map: zero solid-material microgravity tests above 22.7 % O₂." },
  { t: "Fire spread at lunar & Martian gravity", w: "Moon and Mars gravity are not simply between space and Earth. LUCI and FM2 will provide the first partial-gravity data." },
  { t: "Find suppressant limits at enriched O₂", w: "FLEX limiting-O₂ maps stop near 34 % O₂ for droplets. Enriched-air extinguisher sizing needs solid-fuel data too." },
  { t: "Calibrate detectors for smoke and lunar dust together", w: "SAME-R shows material-specific smoke growth, and DAFT proved the counters work in orbit. Lunar dust will be a new false-alarm source." },
];

export function Gaps() {
  return (
    <section>
      <SectionHead
        id="gaps"
        title={<>What the data can't tell us yet</>}
        lede="The dashboard's most useful output may be where the evidence runs out. These gaps come straight from the habitat coverage analysis."
      />
      <Card inner="p-5 md:p-6">
        <div className="text-[12px] font-medium text-ink-2">Gravity coverage in PSI combustion data</div>
        <div className="grid gap-8 pt-4 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="relative mx-3 mt-8 h-1 rounded-full bg-white/10" role="img" aria-label="Gravity axis from 0 to 1 g: data exists at 0 g and 1 g, none at lunar 0.16 g or Martian 0.38 g">
              <div className="absolute inset-y-0 left-[16%] right-[62%] bg-critical/40" />
              {GRAVITY.map((p) => (
                <div key={p.g} className="absolute -top-[10px] -translate-x-1/2" style={{ left: `${p.v * 100}%` }}>
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-surface ${p.has ? "bg-good text-bg" : "bg-critical text-white"}`}>
                    {p.has ? <Check size={12} weight="bold" /> : <X size={12} weight="bold" />}
                  </div>
                  <div className="num absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-[12px] font-medium text-ink">{p.g}</div>
                </div>
              ))}
            </div>
            <dl className="mt-10 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {GRAVITY.map((p) => (
                <div key={p.g} className="flex gap-2.5">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${p.has ? "bg-good" : "bg-critical"}`} aria-hidden />
                  <div>
                    <dt className="text-[13px] font-medium">{p.name} <span className="num font-normal text-muted">· {p.g}</span></dt>
                    <dd className={`text-[12.5px] leading-snug ${p.has ? "text-ink-2" : "text-critical"}`}>{p.text}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>
          <p className="max-w-[60ch] text-[13px] leading-relaxed text-ink-2 lg:col-span-5 lg:border-l lg:border-white/[0.06] lg:pl-8">
            <span className="font-medium text-ink">Not in between.</span> It is tempting to assume Moon and Mars fires fall between the space and Earth results. The ground work behind NASA's FM2 suggests the opposite can happen: some materials burn at lower oxygen in lunar gravity than on Earth, because a weak upward flow feeds the flame. ACME E-FIELD mimics weak buoyancy with an electric field and is the only proxy in PSI today.
          </p>
        </div>
      </Card>

      <div className="mt-8 mb-4 max-w-2xl">
        <h3 className="text-[15px] font-semibold">Back on Earth</h3>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-2">Spacecraft fire research has already paid off on the ground.</p>
      </div>
      <div className="grid gap-x-8 gap-y-6 border-t border-white/[0.07] pt-6 sm:grid-cols-2 md:grid-cols-4">
        {SPINOFFS.map((s) => (
          <a key={s.name} href={s.link} target="_blank" rel="noreferrer" className="group block">
            <div className="flex items-center gap-1.5 font-medium transition-colors group-hover:text-flame">
              {s.name}
              <ArrowUpRight size={13} weight="light" className="text-muted transition-transform duration-300 ease-spring group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-flame" />
            </div>
            <div className="mt-1.5 text-[13px] leading-relaxed text-ink-2">{s.text}</div>
          </a>
        ))}
      </div>

      <Card className="mt-8" delay={60} inner="p-5 md:p-6">
        <h3 className="text-[15px] font-semibold">SI-recommended next experiments</h3>
        <p className="mt-1 text-[13px] text-ink-2">FM2 and LUCI are already planned for Moon gravity, so the most useful new test is real cabin materials at 26.5–34 % oxygen.</p>
        <ol className="mt-5 grid gap-x-8 gap-y-5 md:grid-cols-2">
          {NEXT.map((n, i) => (
            <li key={n.t} className="flex gap-3">
              <span className="num mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ug/10 text-[12px] text-ug ring-1 ring-ug/25">{i + 1}</span>
              <div>
                <div className="text-[14px] font-medium leading-snug">{n.t}</div>
                <div className="mt-1 max-w-[65ch] text-[12.5px] leading-relaxed text-ink-2">{n.w}</div>
              </div>
            </li>
          ))}
        </ol>
      </Card>
    </section>
  );
}
