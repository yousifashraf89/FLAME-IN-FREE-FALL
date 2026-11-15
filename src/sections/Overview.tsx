import { useMemo, type ReactNode } from "react";
import { ArrowRight } from "@phosphor-icons/react";
import { HABITAT_SHORT, type Habitat } from "../data/ai";
import { DATA, DEFAULT_WEIGHTS, INVS, PHASE_COLOR, PHASE_LABEL, PILLAR_COLOR, TOTALS, encodeWeights, habitatMatch, inZone, rank, type Weights } from "../lib/data";
import { FindingList, LeadFinding } from "./Findings";
import { Card, CountUp, Status, useEntered } from "../components/ui";

function PanelHead({ title, href, link }: { title: ReactNode; href: string; link: string }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <div className="text-[12px] font-medium text-ink-2">{title}</div>
      <a href={href} className="group inline-flex items-center gap-1 text-[12px] text-muted transition-colors hover:text-ug">
        {link} <ArrowRight size={12} className="transition-transform duration-200 group-hover:translate-x-0.5" />
      </a>
    </div>
  );
}

const PHASES = ["solid", "liquid", "gas"] as const;

function HabitatSnapshot({ h, onOpen }: { h: Habitat; onOpen: (id: string) => void }) {
  const { total, byPhase, n, closest } = useMemo(() => {
    const amb = DATA.atmosphere.filter((p) => p.mode === "ambient");
    const hit = amb.filter((p) => inZone(p, h));
    const byPhase = Object.fromEntries(PHASES.map((ph) => [ph, hit.filter((p) => p.phase === ph).length])) as Record<(typeof PHASES)[number], number>;
    const closest = INVS.filter((i) => i.type === "flight")
      .map((i) => ({ i, m: habitatMatch(i.id, h) }))
      .filter((x) => x.m > 0.25)
      .sort((a, b) => b.m - a.m || b.i.nTests - a.i.nTests)
      .slice(0, 4);
    return { total: amb.length, byPhase, n: hit.length, closest };
  }, [h]);
  const noSolids = byPhase.solid === 0;
  const on = useEntered(250);
  return (
    <Card delay={60} className="h-full" inner="p-5 flex flex-col">
      <PanelHead title={`Test coverage · ${HABITAT_SHORT[h.id]}`} href="#atmosphere" link="Habitat lens" />
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="num text-3xl font-medium tracking-tight">
            <CountUp value={n} delay={200} />
            <span className="text-base text-muted"> / {total}</span>
          </div>
          <div className="text-[12px] text-muted">
            NASA tests close to this habitat's air ({h.o2} % oxygen, {h.psi} psi)
          </div>
        </div>
        {noSolids ? <Status tone="critical" /> : <Status tone="good" />}
      </div>
      <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-white/[0.05]" role="img" aria-label="Matching tests by fuel type">
        {PHASES.map((ph) => (
          <div key={ph} style={{ width: on ? `${(byPhase[ph] / Math.max(n, 1)) * 100}%` : 0, background: PHASE_COLOR[ph] }} className="h-full border-r-2 border-[#0c1019] transition-[width] duration-700 ease-spring last:border-0" />
        ))}
      </div>
      <ul className="mt-3 grid gap-1.5 text-[12px]">
        {PHASES.map((ph) => (
          <li key={ph} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-sm" style={{ background: PHASE_COLOR[ph] }} />
            <span className="text-ink-2">{PHASE_LABEL[ph]}</span>
            <span className={`num ml-auto ${ph === "solid" && noSolids ? "text-critical" : "text-ink"}`}><CountUp value={byPhase[ph]} delay={250} /></span>
          </li>
        ))}
      </ul>
      {closest.length > 0 && (
        <div className="mt-5 border-t border-white/[0.06] pt-4">
          <div className="text-[12px] font-medium text-ink-2">Closest flight investigations</div>
          <ul className="mt-1.5">
            {closest.map(({ i, m }) => (
              <li key={i.id}>
                <button onClick={() => onOpen(i.id)} className="-mx-2 flex min-h-8 w-[calc(100%+1rem)] items-center gap-2 rounded-md px-2 text-left text-[12.5px] transition-colors hover:bg-white/[0.04]">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: PHASE_COLOR[i.ai.phase] }} />
                  <span className="truncate text-ink">{i.ai.name}</span>
                  <span className="num ml-auto whitespace-nowrap text-ink-2">{Math.round(m * 100)}% match</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="mt-auto pt-4 text-[12px] leading-snug text-muted">
        {noSolids ? "No real cabin material has been burned in microgravity at this atmosphere." : "Solid cabin materials have been tested near this atmosphere."}
      </p>
    </Card>
  );
}

function TopFive({ h, w, onOpen }: { h: Habitat; w: Weights; onOpen: (id: string) => void }) {
  const rows = useMemo(() => rank(h, w).slice(0, 5), [h, w]);
  const custom = encodeWeights(w) !== encodeWeights(DEFAULT_WEIGHTS);
  const on = useEntered(300);
  return (
    <Card delay={120} inner="p-5">
      <PanelHead title={`Most relevant for ${HABITAT_SHORT[h.id]}`} href="#ranking" link="Full ranking" />
      <ol className="grid gap-1">
        {rows.map((r, i) => (
          <li key={r.inv.id}>
            <button onClick={() => onOpen(r.inv.id)} className="group grid w-full grid-cols-[18px_1fr_auto] items-center gap-x-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/[0.04]">
              <span className="num text-[12px] text-muted">{i + 1}</span>
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-medium group-hover:text-ug">{r.inv.ai.name}</span>
                <span className="mt-1 block h-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <span className="block h-full rounded-full bg-gradient-to-r from-ug/60 to-ug transition-all duration-700 ease-spring" style={{ width: on ? `${r.total}%` : 0, transitionDelay: `${i * 60}ms` }} />
                </span>
              </span>
              <span className="num text-[12px] text-ink-2"><CountUp value={Math.round(r.total)} delay={300 + i * 60} /></span>
            </button>
          </li>
        ))}
      </ol>
      <p className="mt-2 px-2 text-[12px] text-muted">{custom ? "Your custom weights" : "Default weights"}. Click a row for details.</p>
    </Card>
  );
}

const PILLARS = [
  { key: "prevention", label: "Prevention", sub: "flammability, materials", color: PILLAR_COLOR.prevention },
  { key: "detection", label: "Detection", sub: "smoke, sensors", color: PILLAR_COLOR.detection },
  { key: "suppression", label: "Suppression", sub: "extinguishing, limits", color: PILLAR_COLOR.suppression },
] as const;

function PillarCoverage() {
  const stats = useMemo(
    () =>
      PILLARS.map((p) => {
        const strong = INVS.filter((i) => i.ai.pillars[p.key] >= 4);
        return { ...p, strong: strong.length, names: strong.map((i) => i.ai.name) };
      }),
    [],
  );
  const max = INVS.length;
  const on = useEntered(350);
  return (
    <Card delay={180} inner="p-5 flex flex-col">
      <PanelHead title="Fire-safety pillar coverage" href="#evidence" link="Evidence" />
      <div className="grid gap-4">
        {stats.map((s, i) => (
          <div key={s.key}>
            <div className="flex items-baseline gap-2">
              <span className="text-[13px] font-medium">{s.label}</span>
              <span className="text-[12px] text-muted">{s.sub}</span>
              <span className="num ml-auto text-[12px] text-ink">
                {s.strong}
                <span className="text-muted"> / {max}</span>
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full rounded-full transition-[width] duration-700 ease-spring" style={{ width: on ? `${(s.strong / max) * 100}%` : 0, background: s.color, transitionDelay: `${i * 90}ms` }} />
            </div>
            <div className="mt-1 truncate text-[12px] text-muted" title={s.names.join(", ")}>
              {s.names.slice(0, 3).join(" · ")}
              {s.names.length > 3 ? ` +${s.names.length - 3}` : ""}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-auto pt-3 text-[12px] leading-snug text-muted">Investigations scored 4 or 5 of 5 for each pillar (SI judgment).</p>
    </Card>
  );
}

function ArchiveStrip() {
  const kpis = [
    { v: TOTALS.investigations, l: "PSI combustion investigations", s: `${TOTALS.flight} flown on ISS or Cygnus` },
    { v: TOTALS.tests.toLocaleString(), l: "test runs in experimental tables", s: "normalized for this dashboard" },
    { v: `${TOTALS.tb.toFixed(1)} TB`, l: "raw flight data archived", s: "video, sensors, images" },
    { v: TOTALS.pubs, l: "linked publications", s: "papers and NASA reports" },
  ];
  return (
    <section aria-labelledby="archive-h">
      <h2 id="archive-h" className="mb-2 text-[13px] font-medium text-ink-2">
        The archive behind it
      </h2>
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-white/[0.07] ring-1 ring-white/[0.07] md:grid-cols-4">
        {kpis.map((k, i) => (
          <div key={k.l} className="reveal flex flex-col bg-[#0c1019] px-4 py-3.5" style={{ animationDelay: `${i * 50}ms` }}>
            <dt className="order-2 mt-1 text-[12.5px] text-ink">{k.l}</dt>
            <dd className="order-1 num text-2xl font-medium tracking-tight">
              <CountUp value={k.v} delay={i * 50} />
            </dd>
            <dd className="order-3 text-[12px] text-muted">{k.s}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function Method() {
  return (
    <div className="grid gap-4 border-t border-white/[0.06] pt-5 text-[12.5px] leading-relaxed text-muted md:grid-cols-2">
      <p className="max-w-[75ch]">
        <span className="font-medium text-ink-2">Data &amp; method. </span>
        {DATA.source}. Experimental tables and investigation records were fetched from the PSI API and normalized by an open script (scripts/build_data.py). SI summaries, scores and findings were written by an AI model from the PSI text and tables, and every finding cites its sources.
      </p>
      <p className="max-w-[75ch]">
        <span className="font-medium text-ink-2">Scope. </span>
        Covers habitable crew environments. Rocket and propellant fires are outside PSI's scope, because combustion inside engines is effectively independent of gravity.
      </p>
    </div>
  );
}

export function Overview({ h, w, onOpen }: { h: Habitat; w: Weights; onOpen: (id: string) => void }) {
  return (
    <div className="grid gap-3">
      <p className="text-[13.5px] text-ink-2">
        <span className="font-medium text-ink">Start here →</span> the card below is the most important finding for the {HABITAT_SHORT[h.id]}. Want a quick answer instead?{" "}
        <a href="#risk" className="text-ug hover:underline">Try the fire risk check</a>.
      </p>
      <div className="grid gap-3 lg:grid-cols-12">
        <LeadFinding h={h} onOpen={onOpen} className="lg:col-span-8" />
        <div className="lg:col-span-4">
          <HabitatSnapshot h={h} onOpen={onOpen} />
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <TopFive h={h} w={w} onOpen={onOpen} />
        <PillarCoverage />
      </div>
      <FindingList h={h} onOpen={onOpen} />
      <div className="mt-4 grid gap-5">
        <ArchiveStrip />
        <Method />
      </div>
    </div>
  );
}
