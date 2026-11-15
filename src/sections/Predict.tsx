import { useMemo, useState } from "react";
import { Lightning } from "@phosphor-icons/react";
import { PLACES, psi } from "../lib/risk";
import { DROP_FUELS, EXTRA, GAS_FUELS, drop, gas, gasName, type Row } from "../lib/predict";
import { Card, Chip, Range, Segmented } from "../components/ui";
import { EChart, INK2, axis, tooltip, type Opt } from "../components/EChart";
import MODELS from "../data/models.json";

// Trained models (scikit-learn gradient boosting, 5-fold cross-validated), exported as prediction grids so the
// page looks answers up instantly. Burning rate and lifetime: FLEX (PSI-69). Smoke growth: SAME-R (PSI-101).
const ML = MODELS as unknown as {
  pKpa: number[];
  flex: { o2: number[]; d0: number[]; fuels: Record<string, number[][][][]> };
  smoke: { v: number[]; age: number[]; materials: Record<string, number[][]> };
  metrics: { model: string; data: string; n: number; score: string; guess: string }[];
};
const nearestIdx = (arr: number[], v: number) => arr.reduce((b, x, i) => (Math.abs(x - v) < Math.abs(arr[b] - v) ? i : b), 0);
const score = (name: string) => ML.metrics.find((m) => m.model === name)?.score ?? "";
const SMOKE_COLORS = ["#6aa8ff", "#e07a3f", "#3db87c", "#c98500", "#d55181"];
import { Label, SHORT, field } from "./Risk";

type Mode = "drop" | "gas" | "smoke";
const PRESETS = ["iss", "eva", "mars", "moon"].map((id) => PLACES.find((p) => p.id === id)!);
const span = (v: number[]) => { const [a, b] = [Math.min(...v).toFixed(1), Math.max(...v).toFixed(1)]; return a === b ? a : `${a}–${b}`; };
const GOOD = "#3db87c", BAD = "#ef5f5f", LINE = "#6aa8ff";

function Slider({ id, label, value, min, max, step, fmt, onChange }: { id: string; label: string; value: number; min: number; max: number; step: number; fmt: (v: number) => string; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-[12px]">
        <label htmlFor={id} className="text-muted">{label}</label>
        <span className="num text-ink">{fmt(value)}</span>
      </div>
      <Range id={id} min={min} max={max} step={step} value={value} onChange={onChange} className="mt-1" />
    </div>
  );
}

export function Predict() {
  const [mode, setMode] = useState<Mode>("drop");
  const [fuel, setFuel] = useState<string>("Heptane");
  const [sup, setSup] = useState<"" | "+co2" | "+he">("");
  const [gasFuel, setGasFuel] = useState<string>("30% ethane");
  const [flow, setFlow] = useState(1);
  const [o2, setO2] = useState(21);
  const [p, setP] = useState(101.3);
  const [vi, setVi] = useState(ML.smoke.v.length - 1);
  const [drop0, setDrop0] = useState(1);

  const m = mode === "gas" ? gas : drop;
  const key = mode === "drop" ? fuel + sup : gasFuel;
  const q = { o2, p, key, m: mode === "gas" ? flow : undefined };
  const res = useMemo(() => m.predict(q), [mode, key, o2, p, flow]); // eslint-disable-line react-hooks/exhaustive-deps
  const pct = Math.round(res.out * 100);
  const verdict = pct >= 65 ? { word: "Likely to go out by itself", c: "text-good" } : pct <= 35 ? { word: "Likely to keep burning", c: "text-critical" } : { word: "Could go either way", c: "text-warning" };

  const chart = useMemo<Opt>(() => {
    const lo = 10, hi = 40;
    const same = m.rows.filter((r) => r.key === key);
    return {
      grid: { left: 52, right: 16, top: 18, bottom: 44 },
      tooltip: { ...tooltip, trigger: "item", formatter: (x: any) => (x.seriesType === "scatter" ? `${(x.data.r as Row).label}<br/><b>${x.data.r.out ? "went out by itself" : "kept burning"}</b>` : `${x.value[0]} % oxygen: <b>${x.value[1]} %</b> chance it goes out`) },
      xAxis: axis("Oxygen (%)", { type: "value", min: lo, max: hi, interval: 5 }),
      yAxis: axis("% chance it goes out", { type: "value", min: 0, max: 100, interval: 25, nameGap: 38 }),
      series: [
        {
          type: "scatter",
          symbolSize: 6,
          z: 1,
          data: same.map((r, i) => ({ value: [r.o2, r.out ? 98 - (i % 4) * 1.5 : 2 + (i % 4) * 1.5], r, itemStyle: { color: r.out ? GOOD : BAD, opacity: 0.55 } })),
        },
        {
          type: "line",
          smooth: true,
          showSymbol: false,
          z: 2,
          lineStyle: { color: LINE, width: 2 },
          data: m.curve(q, lo, hi),
          markArea: { silent: true, itemStyle: { color: "rgba(255,255,255,0.04)" }, label: { color: INK2, fontSize: 12, position: "insideTop" }, data: [[{ name: "Not tested", xAxis: m.range.o2[1] }, { xAxis: hi }]] },
          markLine: { silent: true, symbol: "none", label: { color: INK2, fontSize: 12, formatter: `${o2} %` }, lineStyle: { color: "#eef1f6", type: "solid", width: 1 }, data: [{ xAxis: o2 }] },
        },
      ],
    };
  }, [mode, key, p, flow, o2]); // eslint-disable-line react-hooks/exhaustive-deps

  // PSI-117: size at which each flame went out, for ~4 mm n-dodecane drops (3 atm left out: no cool-flame end recorded)
  const coolRows = EXTRA.cool.filter((c) => c.p < 200);
  const ps = [...new Set(coolRows.map((c) => c.p))].sort((a, b) => a - b);
  const at = (kind: "hot" | "cool", pr: number) => Math.min(...coolRows.filter((c) => c.kind === kind && c.p === pr).map((c) => c.d));
  const coolChart = useMemo<Opt>(
    () => ({
      grid: { left: 52, right: 16, top: 30, bottom: 44 },
      tooltip: { ...tooltip, trigger: "axis", formatter: (x: any) => `${x[0].axisValue}<br/>${x.map((s: any) => `${s.seriesName}: <b>${s.value} mm</b>`).join("<br/>")}` },
      legend: { top: 0, right: 0, textStyle: { color: INK2, fontSize: 12 }, itemWidth: 10, itemHeight: 10 },
      xAxis: axis("Pressure", { type: "category", data: ps.map((x) => `${Math.round(x)} kPa`) }),
      yAxis: axis("Drop size when it went out (mm)", { type: "value", nameGap: 38 }),
      series: [
        { name: "Visible flame", type: "bar", barMaxWidth: 18, barGap: "15%", itemStyle: { color: "#e07a3f", borderRadius: [4, 4, 0, 0] }, data: ps.map((x) => at("hot", x)) },
        { name: "Hidden cool flame", type: "bar", barMaxWidth: 18, itemStyle: { color: LINE, borderRadius: [4, 4, 0, 0] }, data: ps.map((x) => at("cool", x)) },
      ],
    }),
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const hot = EXTRA.cool.filter((c) => c.kind === "hot" && c.p > 70 && c.p < 130).map((c) => c.d);
  const cool = EXTRA.cool.filter((c) => c.kind === "cool" && c.p > 70 && c.p < 130).map((c) => c.d);

  // FLEX burning rate and flame lifetime from the trained model (air with no added extinguishing gas)
  const fx = ML.flex.fuels[fuel]?.[nearestIdx(ML.flex.o2, o2)]?.[nearestIdx(ML.pKpa, p)]?.[drop0];
  const smokeMats = Object.keys(ML.smoke.materials);
  const smokeChart = useMemo<Opt>(
    () => ({
      grid: { left: 52, right: 16, top: 34, bottom: 44 },
      tooltip: { ...tooltip, trigger: "axis", valueFormatter: (v: number) => `${v.toFixed(2)}×` },
      legend: { top: 0, right: 0, textStyle: { color: INK2, fontSize: 12 }, itemWidth: 10, itemHeight: 10 },
      xAxis: axis("How long the smoke has drifted (s)", { type: "category", data: ML.smoke.age.map(String) }),
      yAxis: axis("Particle size vs start", { type: "value", min: 1, nameGap: 38 }),
      series: smokeMats.map((mat, i) => ({ name: mat, type: "line", smooth: true, symbolSize: 6, lineStyle: { width: 2, color: SMOKE_COLORS[i % 5] }, itemStyle: { color: SMOKE_COLORS[i % 5] }, data: ML.smoke.materials[mat][vi] })),
    }),
    [vi], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const at60 = smokeMats.map((mat) => ({ mat, g: ML.smoke.materials[mat][vi][ML.smoke.age.indexOf(60)] })).sort((a, b) => b.g - a.g);

  const picker = (
    <div>
      <Label>What is burning?</Label>
      <Segmented
        cols={3}
        value={mode}
        onChange={(v) => {
          setMode(v);
          if (v !== "smoke") setO2((x) => Math.min(Math.max(x, v === "gas" ? 18 : 12), v === "gas" ? 40 : 34));
        }}
        options={[{ value: "drop", label: "Fuel drop" }, { value: "gas", label: "Gas flame" }, { value: "smoke", label: "Smoke" }]}
      />
    </div>
  );

  if (mode === "smoke")
    return (
      <section className="grid items-start gap-4 lg:grid-cols-[minmax(300px,360px)_1fr]">
        <div className="lg:sticky lg:top-[72px]">
          <Card inner="p-4 sm:p-5 space-y-5">
            {picker}
            <Slider id="smokeflow" label="Air flow at the source" value={vi} min={0} max={ML.smoke.v.length - 1} step={1} fmt={(i) => `${ML.smoke.v[i]} cm/s`} onChange={setVi} />
            <p className="text-[12px] leading-snug text-muted">Smoke detectors are tuned to particle size. In microgravity smoke lingers, and its particles grow as it ages.</p>
          </Card>
        </div>
        <div className="min-w-0 space-y-4">
          <div className="reveal relative overflow-hidden rounded-[22px] bg-[#0c111b] p-5 ring-1 ring-white/[0.08] sm:p-6">
            <div className="grid gap-5 sm:grid-cols-[auto_1fr] sm:items-center">
              <div>
                <div className="text-[12px] text-muted">{at60[0].mat} smoke after 60 s</div>
                <div className="num mt-1 text-[46px] font-semibold leading-none tracking-tight">{at60[0].g.toFixed(2)}<span className="text-[24px] text-ink-2">×</span></div>
              </div>
              <div className="sm:border-l sm:border-white/[0.07] sm:pl-5">
                <div className="text-[17px] font-semibold text-warning">Different smoke, different signal</div>
                <p className="mt-1 text-[13px] leading-snug text-ink-2">
                  After a minute, {at60[0].mat} smoke particles grow to {at60[0].g.toFixed(2)}× their starting size, against {at60[at60.length - 1].g.toFixed(2)}× for {at60[at60.length - 1].mat}. A detector calibrated on one material’s smoke can misread another’s.
                </p>
                <p className="mt-1.5 text-[12px] text-muted">Trained model, {score("Smoke particle growth")} on tests it had not seen (5-fold cross-validation, {ML.metrics.find((x) => x.model === "Smoke particle growth")?.n} SAME-R runs).</p>
              </div>
            </div>
          </div>
          <Card inner="p-5">
            <h3 className="text-[14px] font-semibold">How smoke particles grow as they drift</h3>
            <p className="mt-1 text-[12.5px] text-ink-2">Predicted particle size relative to the start, by material, at the chosen air flow.</p>
            <EChart option={smokeChart} height={290} />
          </Card>
          <p className="text-[12px] text-muted">Data: SAME-R (PSI-101), smoke from heated spacecraft materials on the ISS.</p>
        </div>
      </section>
    );

  return (
    <section className="grid items-start gap-4 lg:grid-cols-[minmax(300px,360px)_1fr]">
      <div className="lg:sticky lg:top-[72px]">
        <Card inner="p-4 sm:p-5 space-y-5">
          {picker}

          {mode === "drop" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3 text-[12px] text-muted">
                Fuel <Segmented size="xs" value={fuel} onChange={setFuel} options={DROP_FUELS.map((f) => ({ value: f, label: f }))} />
              </div>
              <div className="flex items-center justify-between gap-3 text-[12px] text-muted">
                Extinguishing gas in the air <Segmented size="xs" value={sup} onChange={setSup} options={[{ value: "", label: "None" }, { value: "+co2", label: "CO₂" }, { value: "+he", label: "Helium" }]} />
              </div>
              <div className="flex items-center justify-between gap-3 text-[12px] text-muted">
                Drop size <Segmented size="xs" value={String(drop0)} onChange={(v) => setDrop0(+v)} options={ML.flex.d0.map((d, i) => ({ value: String(i), label: `${d} mm` }))} />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block text-[12px] text-muted">
                Gas
                <select value={gasFuel} onChange={(e) => setGasFuel(e.target.value)} className={`${field} mt-1 h-9`}>
                  {GAS_FUELS.map((f) => <option key={f} value={f}>{gasName(f)}</option>)}
                </select>
              </label>
              <Slider id="flow" label="How fast the gas comes out" value={flow} min={0.1} max={3.2} step={0.05} fmt={(v) => `${v.toFixed(2)} mg/s`} onChange={setFlow} />
            </div>
          )}

          <div className="space-y-3 border-t border-white/[0.06] pt-4">
            <Label>Air around it</Label>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((pl) => (
                <Chip text key={pl.id} active={o2 === pl.o2 && p === pl.p} onClick={() => { setO2(pl.o2); setP(pl.p); }}>{SHORT[pl.id]}</Chip>
              ))}
            </div>
            <Slider id="o2" label="Oxygen" value={o2} min={10} max={40} step={0.5} fmt={(v) => `${v} %`} onChange={setO2} />
            <Slider id="p" label="Pressure" value={p} min={30} max={310} step={0.5} fmt={(v) => `${Math.round(v)} kPa · ${psi(v)} psi`} onChange={setP} />
          </div>
          <p className="text-[12px] leading-snug text-muted">The answer updates as you move the sliders.</p>
        </Card>
      </div>

      <div className="min-w-0 space-y-4">
        <div className="reveal relative overflow-hidden rounded-[22px] bg-[#0c111b] p-5 ring-1 ring-white/[0.08] sm:p-6">
          <div className="grid gap-5 sm:grid-cols-[auto_1fr] sm:items-center">
            <div>
              <div className="text-[12px] text-muted">Chance it goes out by itself</div>
              <div className="num mt-1 text-[46px] font-semibold leading-none tracking-tight">{pct}<span className="text-[24px] text-ink-2"> %</span></div>
            </div>
            <div className="sm:border-l sm:border-white/[0.07] sm:pl-5">
              <div className={`text-[17px] font-semibold ${verdict.c}`}>{verdict.word}</div>
              <p className="mt-1 text-[13px] leading-snug text-ink-2">
                From the {res.near.length} most similar of {m.rows.length} real {mode === "drop" ? "fuel-drop fires (FLEX)" : "gas flames (ACME CFI-G)"} on the ISS.
                {res.time != null && <> Similar {mode === "drop" ? "drops" : "flames"} burned for about <span className="num text-ink">{Math.round(res.time)} s</span>.</>}
              </p>
              <p className="mt-1.5 text-[12px] text-muted">
                Right {Math.round(m.accuracy() * 100)} % of the time on tests it had not seen. Always guessing the more common outcome: {Math.round(m.baseline() * 100)} %.
              </p>
            </div>
          </div>
          {(res.outside || res.n === 0) && (
            <p className="mt-4 flex gap-2 text-[12.5px] text-warning">
              <Lightning size={13} weight="fill" className="mt-0.5 shrink-0" />
              {res.n === 0 ? "NASA never flew this exact fuel mix; the answer leans on other fuels." : res.outside}
            </p>
          )}
        </div>

        {mode === "drop" && fx && (
          <Card inner="p-5">
            <h3 className="text-[14px] font-semibold">If it keeps burning: how fast and how long</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-white/[0.03] p-4 ring-1 ring-white/[0.06]">
                <div className="num text-[28px] font-semibold leading-none">{fx[1].toFixed(2)}<span className="text-[15px] text-ink-2"> mm²/s</span></div>
                <div className="mt-2 text-[12.5px] text-ink-2">burning rate · likely <span className="num">{fx[0].toFixed(2)}–{fx[2].toFixed(2)}</span></div>
              </div>
              <div className="rounded-xl bg-white/[0.03] p-4 ring-1 ring-white/[0.06]">
                <div className="num text-[28px] font-semibold leading-none">{Math.round(fx[4])}<span className="text-[15px] text-ink-2"> s</span></div>
                <div className="mt-2 text-[12.5px] text-ink-2">flame lifetime for a {ML.flex.d0[drop0]} mm drop · likely <span className="num">{Math.round(fx[3])}–{Math.round(fx[5])} s</span></div>
              </div>
            </div>
            <p className="mt-3 text-[12px] text-muted">
              Trained model (gradient boosting with a likely range), checked on FLEX tests it had not seen: burning rate {score("Liquid fuel: burning rate")}, lifetime {score("Liquid fuel: flame lifetime")}.
              {sup ? " Shown for air with no added extinguishing gas." : ""} {fx[7] >= 1.5 ? "These conditions are far from any FLEX test, so treat this as a rough guide." : ""}
            </p>
          </Card>
        )}

        <Card inner="p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-[14px] font-semibold">How oxygen changes the answer</h3>
            <span className="flex items-center gap-3 text-[12px] text-muted">
              <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full" style={{ background: GOOD }} />went out</span>
              <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full" style={{ background: BAD }} />kept burning</span>
            </span>
          </div>
          <p className="mt-1 text-[12.5px] text-ink-2">The line is the prediction at this pressure{mode === "gas" ? " and gas flow" : ""}. Each dot is a real ISS test with the same fuel, at any pressure.</p>
          <EChart option={chart} height={270} />
        </Card>

        <Card inner="p-5">
          <h3 className="text-[14px] font-semibold">The closest real tests</h3>
          <ul className="mt-3 divide-y divide-white/[0.05]">
            {res.near.slice(0, 6).map((r, i) => (
              <li key={i} className="flex items-center justify-between gap-3 py-2 text-[13px]">
                <span className="min-w-0 truncate text-ink-2">{r.label}</span>
                <span className={`shrink-0 text-[12px] font-medium ${r.out ? "text-good" : "text-critical"}`}>{r.out ? "went out" : "kept burning"}{r.time != null ? ` · ${Math.round(r.time)} s` : ""}</span>
              </li>
            ))}
          </ul>
        </Card>

        {mode === "drop" && (
          <Card inner="p-5">
            <h3 className="text-[14px] font-semibold">Inside the data: the hidden cool flame</h3>
            <p className="mt-1 max-w-[70ch] text-[12.5px] leading-relaxed text-ink-2">
              A fuel drop can keep burning after its flame seems to go out. In FLEX, the visible flame on n-dodecane drops went out when they were about{" "}
              <span className="num text-ink">{span(hot)} mm</span> across, yet an invisible "cool flame" kept burning them down to <span className="num text-ink">{span(cool)} mm</span> near sea-level pressure. A fire that looks out may not be.
            </p>
            <EChart option={coolChart} height={230} />
          </Card>
        )}
        <p className="text-[12px] text-muted">{mode === "drop" ? `Data: FLEX (PSI-69). Cool flame: ${EXTRA.source.cool}` : EXTRA.source.gas}</p>
      </div>
    </section>
  );
}
