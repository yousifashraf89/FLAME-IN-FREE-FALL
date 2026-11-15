import { useMemo, useState } from "react";
import type { Habitat } from "../data/ai";
import { CRITERIA, DEFAULT_WEIGHTS, rank, type Weights } from "../lib/data";
import { EChart, INK, INK2, MUTED, axis, tooltip, type Opt } from "../components/EChart";
import { Card, Range, SectionHead, Segmented } from "../components/ui";

const COLORS = ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181"];
const PRESETS: Record<string, { label: string; w: Weights }> = {
  balanced: { label: "Balanced", w: DEFAULT_WEIGHTS },
  habitat: { label: "Habitat design", w: { safety: 3, habitat: 5, realism: 3, model: 0, depth: 1 } },
  model: { label: "Modelers", w: { safety: 1, habitat: 1, realism: 1, model: 5, depth: 3 } },
  materials: { label: "Materials selection", w: { safety: 3, habitat: 2, realism: 5, model: 1, depth: 1 } },
};

export function Ranking({ h, w, setW, onOpen }: { h: Habitat; w: Weights; setW: (w: Weights) => void; onOpen: (id: string) => void }) {
  const [ground, setGround] = useState(true);
  const preset = Object.keys(PRESETS).find((k) => CRITERIA.every((c) => PRESETS[k].w[c.key] === w[c.key])) ?? "custom";

  const rows = useMemo(() => rank(h, w).filter((r) => ground || r.inv.type === "flight"), [h, w, ground]);

  const option = useMemo<Opt>(() => {
    const names = rows.map((r) => r.inv.ai.name);
    return {
      grid: { left: 140, right: 48, top: 36, bottom: 44 },
      legend: { type: "scroll", top: 0, left: 0, right: 0, textStyle: { color: INK2, fontSize: 12 }, itemWidth: 10, itemHeight: 10, icon: "roundRect", pageIconColor: INK2, pageTextStyle: { color: MUTED } },
      tooltip: {
        ...tooltip,
        trigger: "axis",
        axisPointer: { type: "shadow", shadowStyle: { color: "rgba(255,255,255,0.03)" } },
        formatter: (ps: any[]) => {
          const r = rows[ps[0].dataIndex];
          const lines = CRITERIA.map((c, i) => `<span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${COLORS[i]};margin-right:6px"></span>${c.label}<span style="float:right;margin-left:18px" class="num">${r.scores[c.key].toFixed(1)}/5</span>`).join("<br/>");
          return `<b>${r.inv.ai.name}</b> <span style="color:${MUTED}">${r.inv.id} · ${r.inv.type}</span><br/><span class="num" style="font-size:18px">${r.total.toFixed(0)}</span><span style="color:${MUTED}"> / 100</span><br/>${lines}`;
        },
      },
      xAxis: axis("Weighted relevance score (0–100)", { type: "value", max: 100, splitNumber: 5 }),
      yAxis: {
        type: "category",
        inverse: true,
        data: names,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: INK, fontSize: 12, fontFamily: "Geist" },
      },
      series: CRITERIA.map((c, i) => ({
        name: c.label,
        type: "bar",
        stack: "s",
        barWidth: 14,
        itemStyle: { color: COLORS[i], borderColor: "#121827", borderWidth: 1, borderRadius: i === CRITERIA.length - 1 ? [0, 4, 4, 0] : 0 },
        emphasis: { focus: "series" },
        label: i === CRITERIA.length - 1 ? { show: true, position: "right", color: INK2, fontFamily: "Geist Mono", fontSize: 12, formatter: (p: any) => rows[p.dataIndex].total.toFixed(0) } : undefined,
        data: rows.map((r) => +r.parts[c.key].toFixed(2)),
      })),
    };
  }, [rows]);

  const set = (k: keyof Weights, v: number) => setW({ ...w, [k]: v });

  return (
    <section>
      <SectionHead
        id="ranking"
        title={<>Which investigations matter most for your mission?</>}
        lede="Each investigation gets five scores. Two are computed from the data (habitat match, data depth) and three are SI judgments with written rationale. Change the weights or the habitat and the ranking re-orders live. Click a bar to open the investigation."
      />
      <div className="grid gap-3 lg:grid-cols-12">
        <Card className="order-2 lg:order-none lg:col-span-4" inner="p-5 flex flex-col gap-5">
          <div>
            <div className="flex items-center justify-between">
              <div className="text-[12px] font-medium text-ink-2">Weighting preset</div>
              {preset === "custom" && (
                <button
                  onClick={() => setW(DEFAULT_WEIGHTS)}
                  className="text-[12px] text-ug hover:underline"
                >
                  Custom · reset
                </button>
              )}
            </div>
            <div className="mt-2">
              <Segmented
                size="sm"
                cols={2}
                value={preset}
                onChange={(p) => PRESETS[p] && setW(PRESETS[p].w)}
                options={Object.entries(PRESETS).map(([k, v]) => ({ value: k, label: v.label }))}
              />
            </div>
          </div>
          <div className="space-y-4">
            {CRITERIA.map((c, i) => (
              <div key={c.key}>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: COLORS[i] }} />{c.label}{"ai" in c && <span className="rounded px-1 text-[12px] text-muted ring-1 ring-white/10" title="Scored by an AI model from the PSI records">AI</span>}</span>
                  <span className="num text-ink-2" title="Weight">weight {w[c.key]}</span>
                </div>
                <Range ticks color={COLORS[i]} min={0} max={5} step={1} value={w[c.key]} onChange={(v) => set(c.key, v)} className="mt-1" aria-label={`${c.label} weight`} />
                <div className="text-[12px] leading-snug text-muted">{c.hint}</div>
              </div>
            ))}
          </div>
          <label className="flex min-h-8 cursor-pointer items-center gap-2 text-[12px] text-ink-2">
            <input type="checkbox" checked={ground} onChange={(e) => setGround(e.target.checked)} className="h-4 w-4 accent-[#6aa8ff]" />
            Include ground (modeling) studies
          </label>
        </Card>
        <Card className="order-1 lg:order-none lg:col-span-8" delay={60} inner="p-4 md:p-5">
          <EChart option={option} height={Math.max(420, rows.length * 25 + 60)} onClick={(p) => onOpen(rows[p.dataIndex].inv.id)} />
        </Card>
      </div>
    </section>
  );
}
