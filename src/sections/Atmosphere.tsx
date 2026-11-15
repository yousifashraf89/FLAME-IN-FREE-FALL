import { useMemo, useState } from "react";
import { HABITATS, HABITAT_SHORT, SUIT, type Habitat } from "../data/ai";
import { DATA, INVS, INV_BY_ID, PHASE_COLOR, PHASE_LABEL, habitatMatch, inZone, label } from "../lib/data";
import { AXIS, EChart, INK, INK2, MUTED, axis, tooltip, type Opt } from "../components/EChart";
import { Card, Chip, SectionHead, Segmented } from "../components/ui";

const PHASES = ["solid", "liquid", "gas"] as const;
const kpaToPsi = (k: number) => k / 6.895;

export function HabitatPicker({ h, setH, full, compact }: { h: Habitat; setH: (h: Habitat) => void; full?: boolean; compact?: boolean }) {
  return (
    <Segmented
      cols={full ? 2 : undefined}
      size={full ? "sm" : compact ? "xs" : "md"}
      value={h.id}
      onChange={(id) => setH(HABITATS.find((x) => x.id === id)!)}
      options={HABITATS.map((x) => ({ value: x.id, label: <>{{ iss: "ISS", eva: "Spacewalk prep", moon: "Moon base", mars: "Mars base" }[x.id]} <span className="num opacity-60">{x.o2}%</span></> }))}
    />
  );
}

export function Atmosphere({ h, setH, onOpen }: { h: Habitat; setH: (h: Habitat) => void; onOpen: (id: string) => void }) {
  const [showOx, setShowOx] = useState(false);

  const option = useMemo<Opt>(() => {
    const pts = DATA.atmosphere;
    const series: any[] = PHASES.map((ph) => ({
      name: PHASE_LABEL[ph],
      type: "scatter",
      symbolSize: 8,
      itemStyle: { color: PHASE_COLOR[ph], opacity: 0.8, borderColor: "#0f1420", borderWidth: 1 },
      emphasis: { scale: 1.6, itemStyle: { opacity: 1 } },
      data: pts.filter((p) => p.mode === "ambient" && p.phase === ph).map((p) => ({ value: [p.o2, p.p], meta: p })),
    }));
    if (showOx)
      series.push({
        name: "Inverse-flame O₂ stream",
        type: "scatter",
        symbol: "emptyCircle",
        symbolSize: 8,
        itemStyle: { color: "#9085e9", borderWidth: 1.5 },
        data: pts.filter((p) => p.mode === "oxidizer").map((p) => ({ value: [p.o2, p.p], meta: p })),
      });
    // constant O2 partial pressure = sea-level air (21.2 kPa): habitats trade pressure for concentration
    const iso = [];
    for (let o = 16; o <= (showOx ? 100 : 46); o += 0.5) iso.push([o, (21.2 / o) * 100]);
    series.push({
      name: "Sea-level O₂ partial pressure",
      type: "line",
      data: iso,
      showSymbol: false,
      lineStyle: { color: MUTED, type: "dashed", width: 1.5 },
      itemStyle: { color: MUTED },
      tooltip: { show: false },
      z: 1,
    });
    series.push({
      name: "Habitats",
      type: "scatter",
      symbol: "circle",
      symbolSize: (_: any, p: any) => (p.data.id === h.id ? 26 : 16),
      itemStyle: { color: "transparent", borderColor: INK, borderWidth: 2 },
      label: { show: true, position: "right", distance: 10, color: INK, fontSize: 12, fontWeight: 500, formatter: (p: any) => p.data.short },
      data: HABITATS.map((x) => ({ value: [x.o2, x.p], id: x.id, short: HABITAT_SHORT[x.id], hab: x, label: x.id === "eva" || x.id === "mars" ? { position: x.id === "eva" ? "left" : "right" } : undefined })),
      z: 5,
      markArea: {
        silent: true,
        itemStyle: { color: "rgba(106,168,255,0.07)", borderColor: "rgba(106,168,255,0.45)", borderWidth: 1, borderType: "dashed" },
        data: [[{ coord: [h.o2 - 4, h.p + 20] }, { coord: [h.o2 + 4, Math.max(41, h.p - 20)] }]],
      },
    });
    return {
      grid: { left: 64, right: 24, top: 48, bottom: 56 },
      legend: { top: 0, left: 0, textStyle: { color: INK2, fontSize: 12 }, itemWidth: 10, itemHeight: 10, icon: "circle", data: [...PHASES.map((p) => PHASE_LABEL[p]), ...(showOx ? ["Inverse-flame O₂ stream"] : []), "Sea-level O₂ partial pressure"] },
      tooltip: {
        ...tooltip,
        trigger: "item",
        formatter: (p: any) => {
          if (p.data.hab) {
            const x = p.data.hab as Habitat;
            return `<b>${x.name}</b><br/>${x.o2} % O₂ · ${x.psi} psi (${x.p} kPa)<br/><span style="color:${INK2}">${x.note}</span><br/><span style="color:${MUTED}">Click to select this habitat</span>`;
          }
          const m = p.data.meta;
          return `<b>${label(m.inv)}</b> <span style="color:${MUTED}">${m.inv}</span><br/>${m.note}<br/><span class="num">${m.o2} % O₂ · ${m.p} kPa (${kpaToPsi(m.p).toFixed(1)} psi)</span>${
            m.assumedP ? `<br/><span style="color:${MUTED}">pressure not in table, nominal value shown</span>` : ""
          }${m.mode === "oxidizer" ? `<br/><span style="color:${MUTED}">O₂ issued from the burner (inverse flame), not ambient</span>` : ""}`;
        },
      },
      xAxis: axis("Oxygen concentration (% by volume)", { type: "value", min: 10, max: showOx ? 100 : 46, splitLine: { lineStyle: { color: "#161c2a" } } }),
      yAxis: axis("Pressure (kPa, log)", { type: "log", min: 40, max: 600, nameGap: 44, axisLine: { show: true, lineStyle: { color: AXIS } }, axisLabel: { color: MUTED, fontFamily: "Geist Mono", fontSize: 12, customValues: [50, 70, 100, 150, 300, 600] }, splitLine: { show: false } }),
      series,
    };
  }, [h, showOx]);

  const stats = useMemo(() => {
    const amb = DATA.atmosphere.filter((p) => p.mode === "ambient");
    const z = amb.filter((p) => inZone(p, h));
    const byPhase = Object.fromEntries(PHASES.map((ph) => [ph, z.filter((p) => p.phase === ph).length]));
    const top = INVS.filter((i) => i.type === "flight")
      .map((i) => ({ id: i.id, m: habitatMatch(i.id, h) }))
      .filter((x) => x.m > 0.25)
      .sort((a, b) => b.m - a.m || INV_BY_ID[b.id].nTests - INV_BY_ID[a.id].nTests)
      .slice(0, 8);
    return { total: amb.length, z: z.length, byPhase, top };
  }, [h]);

  return (
    <section>
      <SectionHead
        id="atmosphere"
        title={<>What has actually been tested at each habitat atmosphere</>}
        lede={
          <>
            Each dot is one microgravity test with a reported oxygen level, placed by O₂ concentration and pressure. Future habitats sit at lower pressure and{" "}
            <span className="text-ink">higher oxygen concentration</span> to shorten spacesuit pre-breathe. That keeps breathing O₂ constant along the dashed line, but materials become much more flammable.
          </>
        }
      />
      <div className="grid gap-3 lg:grid-cols-12">
        <Card className="lg:col-span-8" inner="p-4 md:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-end gap-3">
            <label className="flex min-h-8 cursor-pointer items-center gap-2 text-[12px] text-ink-2">
              <input type="checkbox" checked={showOx} onChange={(e) => setShowOx(e.target.checked)} className="h-4 w-4 accent-[#9085e9]" />
              Show inverse-flame O₂ streams (up to 85 %)
            </label>
          </div>
          <EChart option={option} height={520} onClick={(p) => (p.data?.hab ? setH(p.data.hab) : p.data?.meta && onOpen(p.data.meta.inv))} />
          <p className="mt-2 text-[12px] text-muted">
            Pressure was not logged per test for BASS-II and Saffire (cabin pressure is shown) or for BRE (its planned pressure for each oxygen level is shown). Spacesuit: {SUIT.o2} % O₂ at {SUIT.psi} psi, off this chart.
          </p>
        </Card>

        <div className="grid min-w-0 content-start gap-3 lg:col-span-4">
          <Card delay={60} inner="p-5">
            <div className="text-[12px] font-medium text-ink-2">Selected habitat</div>
            <div className="mt-2 text-xl font-semibold tracking-tight">{h.name}</div>
            <div className="num mt-3 flex gap-6 text-sm">
              <div><div className="text-3xl text-ink">{h.o2}%</div><div className="text-[12px] font-medium text-ink-2">oxygen</div></div>
              <div><div className="text-3xl text-ink">{h.psi}</div><div className="text-[12px] font-medium text-ink-2">psi ({h.p} kPa)</div></div>
            </div>
            <p className="mt-3 text-[12.5px] leading-relaxed text-ink-2">{h.note}</p>
          </Card>
          <Card delay={60} inner="p-5">
            <div className="flex items-baseline justify-between">
              <div className="text-[12px] font-medium text-ink-2">NASA tests near this habitat's air</div>
              <div className="num text-[12px] font-medium text-ink-2">of {stats.total}</div>
            </div>
            <div className="num mt-2 text-5xl font-medium tracking-tight">{stats.z}</div>
            <div className="mt-1 text-[12px] text-muted">inside the dashed box: within 4 points of oxygen and 20 kPa of pressure</div>
            <div className="mt-4 space-y-2.5">
              {PHASES.map((ph) => (
                <div key={ph} className="flex items-center gap-3 text-[12.5px]">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: PHASE_COLOR[ph] }} />
                  <span className="w-32 text-ink-2">{PHASE_LABEL[ph]}</span>
                  <span className={`num ml-auto ${stats.byPhase[ph] === 0 ? "text-critical" : "text-ink"}`}>{stats.byPhase[ph]}</span>
                </div>
              ))}
            </div>
            {stats.byPhase.solid === 0 && (
              <p className="mt-4 flex gap-2 text-[12.5px] leading-snug text-ink">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-critical" aria-hidden />
                No real cabin material (fabric, plastic) has been burned in microgravity at this atmosphere.
              </p>
            )}
            <div className="mt-5 text-[12px] font-medium text-ink-2">Closest flight investigations</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {stats.top.map((t) => (
                <Chip key={t.id} onClick={() => onOpen(t.id)}>
                  {label(t.id)} · {Math.round(t.m * 100)}%
                </Chip>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
