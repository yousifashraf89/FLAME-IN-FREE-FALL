import { useMemo } from "react";
import { HABITATS, HABITAT_SHORT, type Habitat } from "../data/ai";
import { DATA, inZone } from "../lib/data";
import { Card } from "../components/ui";
import { EChart, INK2, MUTED, axis, tooltip, type Opt } from "../components/EChart";

// NFPA 99B: an atmosphere of increased burning is O2 % > 23.45 / sqrt(total pressure in atm).
const ATM_PSI = 14.696;
const nfpaLimit = (psi: number) => 23.45 / Math.sqrt(psi / ATM_PSI);
// Decompression ratio before a spacewalk in a 4.3 psi pure-O2 suit: cabin N2 pressure / suit pressure.
// Lower means a shorter pre-breathe. A relative comparison, not a medical criterion.
const ratio = (h: Habitat) => ((1 - h.o2 / 100) * h.psi) / 4.3;

/** Oxygen map: why exploration cabins raise oxygen, and where that crosses the fire-code line. */
export function AtmoTradeoff({ h }: { h: Habitat }) {
  const option = useMemo<Opt>(() => {
    const psis = Array.from({ length: 41 }, (_, i) => 6 + i * 0.25); // 6 to 16 psi
    return {
      grid: { left: 56, right: 24, top: 36, bottom: 48 },
      tooltip: { ...tooltip, trigger: "item" },
      legend: { top: 0, right: 0, textStyle: { color: INK2, fontSize: 12 }, itemWidth: 12, itemHeight: 8 },
      xAxis: axis("Oxygen (%)", { type: "value", min: 18, max: 40 }),
      yAxis: axis("Cabin pressure (psi)", { type: "value", min: 6, max: 16, nameGap: 38 }),
      series: [
        {
          name: "Fire-code limit (NFPA 99B)",
          type: "line",
          showSymbol: false,
          lineStyle: { color: "#ef5f5f", width: 2 },
          itemStyle: { color: "#ef5f5f" },
          areaStyle: { color: "rgba(239,95,95,0.10)", origin: "end" },
          data: psis.map((p) => [nfpaLimit(p), p]).filter(([o]) => o <= 40),
        },
        {
          name: "Same oxygen to breathe as Earth",
          type: "line",
          showSymbol: false,
          lineStyle: { color: MUTED, width: 1.5, type: "dashed" },
          itemStyle: { color: MUTED },
          data: psis.map((p) => [(3.087 / p) * 100, p]).filter(([o]) => o <= 40),
        },
        {
          name: "Habitats",
          type: "scatter",
          symbolSize: (_: unknown, p: any) => (p.data.id === h.id ? 16 : 11),
          label: { show: true, position: "right", color: INK2, fontSize: 12, formatter: (p: any) => p.data.name },
          itemStyle: { color: "#6aa8ff", borderColor: "#eef1f6", borderWidth: 1 },
          tooltip: { formatter: (p: any) => `${p.data.name}<br/>${p.value[0]} % O₂ · ${p.value[1]} psi` },
          data: HABITATS.map((x) => ({
            id: x.id,
            name: x.id === "eva" ? "Spacewalk prep" : HABITAT_SHORT[x.id] ?? x.name,
            value: [x.o2, x.psi],
            label: { position: x.id === "eva" ? "top" : x.id === "mars" ? "bottom" : "right" },
          })),
        },
      ],
    };
  }, [h.id]);

  return (
    <Card className="mt-6" inner="p-5 md:p-6">
      <h3 className="text-[15px] font-semibold">The trade-off: shorter spacewalk prep vs higher fire risk</h3>
      <p className="mt-1 max-w-[75ch] text-[13px] leading-relaxed text-ink-2">
        Lower cabin pressure means less nitrogen in the body, so crews need less time breathing pure oxygen before a spacewalk. To keep breathing normally, the cabin then needs more oxygen. Above the red line, fire codes call it an <span className="text-ink">atmosphere of increased burning</span>.
      </p>
      <div className="mt-3 grid gap-5 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <EChart option={option} height={320} />
        </div>
        <div className="lg:col-span-5">
          <table className="w-full text-left text-[13px]">
            <thead className="text-[12px] text-muted">
              <tr className="border-b border-white/[0.08]">
                <th className="py-2 pr-3 font-medium">Habitat</th>
                <th className="py-2 pr-3 font-medium">Spacewalk prep</th>
                <th className="py-2 font-medium">Fire code</th>
              </tr>
            </thead>
            <tbody>
              {HABITATS.map((x) => {
                const over = x.o2 > nfpaLimit(x.psi);
                return (
                  <tr key={x.id} className={`border-b border-white/[0.05] ${x.id === h.id ? "bg-white/[0.03]" : ""}`}>
                    <td className="py-2.5 pr-3 text-ink">{HABITAT_SHORT[x.id] ?? x.name}</td>
                    <td className="num py-2.5 pr-3 text-ink-2">{ratio(x).toFixed(2)}</td>
                    <td className={`py-2.5 text-[12.5px] font-medium ${over ? "text-critical" : "text-good"}`}>{over ? "Increased burning" : "Below the line"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-3 text-[12px] leading-relaxed text-muted">
            Spacewalk prep: cabin nitrogen pressure ÷ 4.3 psi suit pressure. Lower means a shorter pre-breathe (a relative comparison, not a medical rule). Fire code: NFPA 99B, oxygen % above 23.45 ÷ √(pressure in atm).
          </p>
          <p className="mt-2 text-[12.5px] leading-relaxed text-ink">
            The spacewalk-prep cabin stays just below the line. Moon and Mars bases cross it, where NASA has no microgravity fire tests on real cabin materials.
          </p>
        </div>
      </div>
    </Card>
  );
}

const PHASES = [
  { id: "solid", label: "Cabin materials" },
  { id: "liquid", label: "Liquid fuels" },
  { id: "gas", label: "Gas flames" },
] as const;

/** Gaps: NASA tests near each habitat's air, by fuel type, counted from the PSI tables. */
export function GapMatrix() {
  const rows = HABITATS.map((x) => ({
    h: x,
    n: Object.fromEntries(PHASES.map((p) => [p.id, DATA.atmosphere.filter((a) => a.mode === "ambient" && a.phase === p.id && inZone(a, x)).length])) as Record<string, number>,
  }));
  const tone = (n: number) => (n === 0 ? "bg-critical/15 text-critical ring-critical/30" : n < 10 ? "bg-warning/10 text-warning ring-warning/25" : "bg-good/10 text-good ring-good/25");
  return (
    <Card className="mb-8" inner="p-5 md:p-6">
      <h3 className="text-[15px] font-semibold">Where the tests are missing, counted from NASA’s data</h3>
      <p className="mt-1 max-w-[75ch] text-[13px] leading-relaxed text-ink-2">
        Microgravity tests within 4 points of oxygen and 20 kPa of each habitat’s air. <span className="text-critical">Red cells</span> have no tests at all: those are the experiments NASA should run next.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-[13px]">
          <thead className="text-[12px] text-muted">
            <tr className="border-b border-white/[0.08]">
              <th className="py-2 pr-4 font-medium">Habitat air</th>
              {PHASES.map((p) => (
                <th key={p.id} className="py-2 pr-4 font-medium">{p.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.h.id} className="border-b border-white/[0.05]">
                <td className="py-2.5 pr-4 text-ink">
                  {HABITAT_SHORT[r.h.id] ?? r.h.name} <span className="num text-[12px] text-muted">{r.h.o2} % · {r.h.psi} psi</span>
                </td>
                {PHASES.map((p) => (
                  <td key={p.id} className="py-2.5 pr-4">
                    <span className={`num inline-block min-w-[44px] rounded-md px-2 py-1 text-center text-[12.5px] font-medium ring-1 ${tone(r.n[p.id])}`}>{r.n[p.id]}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[12px] text-muted">Counted from {DATA.atmosphere.filter((a) => a.mode === "ambient").length.toLocaleString()} test points with a reported oxygen level. Some pressures are nominal (planned), not measured, and are flagged on the oxygen map.</p>
    </Card>
  );
}
