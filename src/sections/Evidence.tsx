import { useMemo, useState } from "react";
import { DATA } from "../lib/data";
import { HABITATS, HABITAT_SHORT, type Habitat } from "../data/ai";
import { EChart, INK, INK2, MUTED, axis, tooltip, type Opt } from "../components/EChart";
import { Card, SectionHead, Segmented } from "../components/ui";

// PSI cells reference footnotes ("note 2") that the table does not ship; drop the dangling references.
const clean = (s: string | null | undefined) => (s ?? "").replace(/\s*\(?(see )?note \d\)?/gi, "").replace(/\(?see fig\.? ?\d+\)?/gi, "").trim() || "—";

const OUTCOME = {
  Extinction: { color: "#3987e5", symbol: "circle", text: "Flame went out before the fuel was used up" },
  Completion: { color: "#d95926", symbol: "triangle", text: "Droplet burned completely (fire won)" },
  Disruption: { color: "#199e70", symbol: "diamond", text: "Droplet broke apart / test disrupted" },
} as const;

function Block({ id, source, title, children, reading }: { id: string; source: string; title: string; children: React.ReactNode; reading: React.ReactNode }) {
  return (
    <div id={id} className="scroll-mt-20">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-[15px] font-semibold tracking-tight">{title}</h3>
        <span className="num text-[12px] text-muted">{source}</span>
      </div>
      <div className="grid gap-3 lg:grid-cols-12">
        <Card className="lg:col-span-8" inner="p-4 md:p-5">{children}</Card>
        <Card className="lg:col-span-4" delay={60} inner="p-5">
          <div className="text-[12px] font-medium text-ug">SI reading</div>
          <div className="mt-2.5 space-y-3 text-[13px] leading-relaxed text-ink-2">{reading}</div>
        </Card>
      </div>
    </div>
  );
}

function Suppression({ h }: { h: Habitat }) {
  const [dil, setDil] = useState<"co2" | "he">("co2");
  const [fuel, setFuel] = useState("All");
  const rows = DATA.flex.filter((f) => fuel === "All" || f.fuel === fuel);
  const share = (pred: (f: (typeof rows)[0]) => boolean) => {
    const s = rows.filter(pred);
    return { n: s.length, ext: s.filter((f) => f.end === "Extinction").length };
  };
  const groups = [
    { l: "No suppressant", ...share((f) => !f.co2 && !f.he) },
    { l: "CO₂ added", ...share((f) => f.co2 > 0) },
    { l: "Helium added", ...share((f) => f.he > 0) },
  ];

  // many runs share the same O2/diluent setting: pack each setting's runs in a sunflower spiral so none hide
  const packed = useMemo(() => {
    const cells = new Map<string, typeof rows>();
    for (const f of rows.filter((f) => (dil === "co2" ? f.he === 0 : f.co2 === 0))) {
      const key = `${f.o2}|${dil === "co2" ? f.co2 : f.he}`;
      cells.set(key, [...(cells.get(key) ?? []), f]);
    }
    const order = ["Extinction", "Disruption", "Completion"];
    const out: { f: (typeof rows)[0]; x: number; y: number; n: number }[] = [];
    for (const list of cells.values()) {
      list.sort((a, b) => order.indexOf(a.end) - order.indexOf(b.end));
      list.forEach((f, k) => {
        const r = 0.36 * Math.sqrt(k), a = k * 2.39996;
        out.push({ f, x: f.o2 * 100 + r * Math.cos(a), y: (dil === "co2" ? f.co2 : f.he) * 100 + r * Math.sin(a) * 4.2, n: list.length });
      });
    }
    return out;
  }, [dil, fuel]);

  const option = useMemo<Opt>(
    () => ({
      grid: { left: 60, right: 20, top: 40, bottom: 52 },
      legend: { top: 0, left: 0, textStyle: { color: INK2, fontSize: 12 }, itemWidth: 10, itemHeight: 10 },
      tooltip: {
        ...tooltip,
        formatter: (p: any) => {
          const f = p.data.f;
          return `<b>${f.fuel} droplet</b> · ${f.end}<br/><span class="num">${(f.o2 * 100).toFixed(0)} % O₂ · ${(f.co2 * 100).toFixed(0)} % CO₂ · ${(f.he * 100).toFixed(0)} % He</span><br/><span class="num">${f.p ?? "?"} kPa · d₀ ${f.d0 ?? "?"} mm · burn ${f.tb ?? "?"} s</span>`;
        },
      },
      xAxis: axis("Oxygen (% mole fraction)", { type: "value", min: 10, max: 35, interval: 5 }),
      yAxis: axis(dil === "co2" ? "CO₂ added (%)" : "Helium added (%)", { type: "value", min: -2, max: 75, nameGap: 40 }),
      series: (Object.keys(OUTCOME) as (keyof typeof OUTCOME)[]).map((o) => ({
        name: o,
        type: "scatter",
        symbol: OUTCOME[o].symbol,
        symbolSize: 8,
        itemStyle: { color: OUTCOME[o].color, opacity: 0.9, borderColor: "#0f1420", borderWidth: 1 },
        data: packed.filter((p) => p.f.end === o).map((p) => ({ value: [p.x, p.y], f: p.f })),
        ...(o === "Extinction" && {
          markLine: {
            silent: true,
            symbol: "none",
            label: { color: INK, fontSize: 12, formatter: "{b}", position: "insideEndTop" },
            data: [{ name: `${HABITAT_SHORT[h.id]} ${h.o2}%`, xAxis: h.o2, lineStyle: { color: "#6aa8ff", type: "dashed", width: 1.5 } }],
          },
        }),
      })),
    }),
    [packed, dil, h],
  );

  return (
    <Block
      id="suppression"
      source="FLEX · 274 ISS droplet burns"
      title="How much inert gas does it take to put a fire out?"
      reading={
        <>
          <p>Each dot is one ISS droplet burn. Moving <span className="text-ink">up</span> adds suppressant, moving <span className="text-ink">right</span> adds oxygen. Blue circles are fires that went out on their own; orange triangles burned to completion.</p>
          <div className="space-y-2 pt-1">
            {groups.map((g) => (
              <div key={g.l}>
                <div className="flex justify-between text-[12px]"><span>{g.l}</span><span className="num text-ink">{Math.round((g.ext / g.n) * 100)}% extinguished · n={g.n}</span></div>
                <div className="mt-1 h-1.5 rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-s1" style={{ width: `${(g.ext / g.n) * 100}%` }} /></div>
              </div>
            ))}
          </div>
          <p>Burns that ran to completion sat at higher O₂ (median 21 %) with about half the suppressant of runs that went out (median 18 % O₂). That corner is where a cabin fire wins. Methanol still burned for up to 11 s at only 12 % O₂.</p>
          <p className="text-[12px] text-muted">Runs at the same setting are packed into a small cluster around it.</p>
          <p className="text-[12px] text-muted">The test matrix was designed, not randomized, and helium runs used less oxygen, so treat the shares as tendencies, not a ranking.</p>
        </>
      }
    >
      <div className="mb-3 flex flex-wrap gap-2">
        <Segmented size="sm" value={dil} onChange={setDil} options={[{ value: "co2", label: "CO₂ suppressant" }, { value: "he", label: "Helium suppressant" }]} />
        <Segmented size="sm" value={fuel} onChange={setFuel} options={["All", "Methanol", "Heptane"].map((v) => ({ value: v, label: v }))} />
      </div>
      <EChart option={option} height={420} />
    </Block>
  );
}

const verdict = (r: (typeof DATA.saffire)[0]) => {
  const ug0 = (r.ugBurn ?? "").includes("~ 0");
  const gFull = (r.gBurn ?? "").includes("Complete");
  const g0 = (r.gBurn ?? "").startsWith("~ 0");
  if (r.material.includes("Nomex")) return { t: "PMMA burned, Nomex resisted", c: "text-warning bg-warning/10 ring-warning/25" };
  if (ug0 && !g0) return { t: "Earth test more severe", c: "text-good bg-good/10 ring-good/25" };
  if (!ug0 && gFull && (r.ugBurn ?? "").includes("29")) return { t: "Burns fully in both", c: "text-critical bg-critical/10 ring-critical/25" };
  if (ug0 && g0) return { t: "Self-extinguishes in both", c: "text-good bg-good/10 ring-good/25" };
  return { t: "Partial in space, full on Earth", c: "text-warning bg-warning/10 ring-warning/25" };
};

function Materials() {
  const s2 = DATA.saffire.filter((r) => r.mission === "Saffire-II");
  const option = useMemo<Opt>(() => {
    const fams = ["PMMA", "SIBAL fabric", "Other"];
    return {
      grid: { left: 96, right: 24, top: 24, bottom: 48 },
      tooltip: { ...tooltip, formatter: (p: any) => `<b>${p.data.b.material}</b><br/><span class="num">${p.data.b.o2i} % O₂ initial · test ${p.data.b.test}</span>` },
      xAxis: axis("Initial O₂ in BASS-II tests (%)", { type: "value", min: 12, max: 35 }),
      yAxis: { type: "category", data: fams, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: INK, fontSize: 12 } },
      series: [
        {
          type: "scatter",
          symbolSize: 9,
          itemStyle: { color: "#d95926", opacity: 0.75, borderColor: "#0f1420", borderWidth: 1 },
          data: DATA.bass2.filter((b) => b.o2i).map((b, k) => ({ value: [b.o2i, fams.indexOf(b.family) + ((k % 7) - 3) * 0.06], b })),
          markLine: {
            silent: true,
            symbol: "none",
            label: { color: INK, fontSize: 12, formatter: "{b}", position: "insideEndTop" },
            data: HABITATS.slice(1).map((h) => ({ name: `${HABITAT_SHORT[h.id]} ${h.o2}%`, xAxis: h.o2, lineStyle: { color: "#6aa8ff", type: "dashed", width: 1.5 } })),
          },
        },
      ],
    };
  }, []);

  return (
    <Block
      id="materials"
      source="Saffire-II · BASS-II"
      title="Does Earth's material test predict a space fire?"
      reading={
        <>
          <p>NASA approves cabin materials with a <span className="text-ink">1-g upward-burning test</span> (NASA-STD-6001 Test 1). Saffire-II burned the same samples in microgravity at 20 cm/s airflow.</p>
          <p>Thin silicone burned completely in 1 g but barely in microgravity, so the 1-g test was conservative. SIBAL fabric burned its full length either way. BASS tested whether strong airflow makes materials burn <span className="text-ink">as well or better</span> in microgravity.</p>
          <p>The lower chart is the biggest gap: all 129 BASS-II solid burns sit at or below 22.2 % O₂, short of the exploration atmospheres (dashed lines).</p>
        </>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-[12.5px]">
          <thead className="text-[12px] font-medium text-ink-2">
            <tr className="border-b border-white/[0.06]">
              <th className="py-2.5 pr-3 font-normal">Sample</th><th className="py-2.5 pr-3 font-normal">Material · thickness</th><th className="py-2.5 pr-3 font-normal">Flow</th><th className="py-2.5 pr-3 font-normal">Burned in space</th><th className="py-2.5 pr-3 font-normal">Burned on Earth</th><th className="py-2.5 font-normal">Verdict</th>
            </tr>
          </thead>
          <tbody>
            {s2.map((r) => {
              const v = verdict(r);
              return (
                <tr key={r.sample} className="border-b border-white/[0.04] last:border-0">
                  <td className="num py-2.5 pr-3 text-muted">{r.sample}</td>
                  <td className="py-2.5 pr-3 text-ink">{r.material} <span className="num text-muted">· {clean(r.thick)}</span></td>
                  <td className="py-2.5 pr-3 text-ink-2">{r.dir}</td>
                  <td className="num py-2.5 pr-3 text-ug">{clean(r.ugBurn)}</td>
                  <td className="num py-2.5 pr-3 text-flame">{clean(r.gBurn)}</td>
                  <td className="py-2.5"><span className={`rounded-full px-2 py-0.5 text-[12px] ring-1 ${v.c}`}>{v.t}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-6 border-t border-white/[0.06] pt-4">
        <div className="text-[12px] font-medium text-ink-2">BASS-II solid tests vs habitat O₂ targets</div>
        <EChart option={option} height={230} />
      </div>
    </Block>
  );
}

function Smoke() {
  const mats = ["Kapton", "Teflon", "Silicone", "Lampwick", "Pyrell"];
  const colors = ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181"];
  const option = useMemo<Opt>(() => {
    const means = mats.map((m) => {
      const g = DATA.same.filter((s) => s.material === m && s.growth).map((s) => s.growth!);
      return g.reduce((a, b) => a + b, 0) / g.length;
    });
    return {
      grid: { left: 96, right: 24, top: 16, bottom: 52 },
      tooltip: { ...tooltip, formatter: (p: any) => (p.data.s ? `<b>${p.data.s.material}</b> · ${p.data.s.desc}<br/><span class="num">growth ${p.data.s.growth}× · flow ${p.data.s.v} cm/s · aged ${p.data.s.aging ?? "?"} s</span>` : `<b>${p.name}</b> mean <span class="num">${p.value[0].toFixed(2)}×</span>`) },
      xAxis: axis("Smoke particle size growth while aging (R / R₀)", { type: "value", min: 1.15, max: 1.5 }),
      yAxis: {
        type: "category",
        data: mats,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: INK, fontSize: 12, formatter: (m: string, i: number) => `{n|${m}}\n{v|mean ${means[i].toFixed(2)}×}`, rich: { n: { color: INK, fontSize: 12 }, v: { color: MUTED, fontSize: 10.5, fontFamily: "Geist Mono", padding: [3, 0, 0, 0] } } },
      },
      series: [
        ...mats.map((m, i) => ({
          name: m,
          type: "scatter",
          symbolSize: 8,
          itemStyle: { color: colors[i], opacity: 0.55 },
          data: DATA.same.filter((s) => s.material === m && s.growth).map((s, k) => ({ value: [s.growth, i + ((k % 9) - 4) * 0.05], s })),
        })),
        {
          name: "mean",
          type: "scatter",
          symbol: "rect",
          symbolSize: [3, 22],
          itemStyle: { color: INK },
          data: means.map((v, i) => ({ name: mats[i], value: [v, i] })),
          z: 5,
        },
      ],
    };
  }, []);
  return (
    <Block
      id="smoke"
      source="SAME-R · 109 runs"
      title="Smoke from different materials ages differently"
      reading={
        <>
          <p>Smoke detectors are calibrated for particle size. In microgravity, with no buoyant plume, smoke lingers and particles <span className="text-ink">grow as they age</span>.</p>
          <p>Kapton and Teflon (wire insulation, common in spacecraft) grew about <span className="num text-ink">44 %</span> in size, versus about <span className="num text-ink">23 %</span> for Pyrell foam. A detector tuned on one material's smoke can misread another's.</p>
          <p className="text-[12px] text-muted">Bars mark the mean, dots are individual runs (inlet flow 0–8.1 cm/s). R/R₀ is the ratio of aged to initial particle size.</p>
        </>
      }
    >
      <EChart option={option} height={340} />
      <p className="mt-1 text-[12px] text-muted" style={{ color: MUTED }}>Source: PSI-101 experimental table, column Rt/R0.</p>
    </Block>
  );
}

const PILLARS = [
  { value: "materials", label: "Prevention" },
  { value: "smoke", label: "Detection" },
  { value: "suppression", label: "Suppression" },
] as const;
type Pillar = (typeof PILLARS)[number]["value"];

export function Evidence({ h, anchor, setAnchor }: { h: Habitat; anchor?: string; setAnchor: (a: string) => void }) {
  const tab: Pillar = PILLARS.some((p) => p.value === anchor) ? (anchor as Pillar) : "materials";
  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <SectionHead
          id="evidence"
          title={<>The data behind prevention, detection and suppression</>}
          lede="NASA's spacecraft fire strategy rests on three pillars. Every chart is built directly from a PSI experimental table, with an SI reading of what it means for crew safety."
        />
        <Segmented value={tab} onChange={setAnchor} options={PILLARS.map((p) => ({ value: p.value, label: p.label }))} size="sm" />
      </div>
      <div key={tab} className="reveal">
        {tab === "materials" && <Materials />}
        {tab === "smoke" && <Smoke />}
        {tab === "suppression" && <Suppression h={h} />}
      </div>
    </section>
  );
}
