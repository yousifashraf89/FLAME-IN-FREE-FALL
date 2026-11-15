import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Check, MagnifyingGlass, X } from "@phosphor-icons/react";
import type { Category, Habitat } from "../data/ai";
import { CRITERIA, INVS, fmtSize, INV_BY_ID, PHASE_COLOR, criterionScores, rank, type Inv, type Weights } from "../lib/data";
import { EChart, INK2, tooltip, type Opt } from "../components/EChart";
import { Card, Chip, SectionHead } from "../components/ui";

const CATS: ("All" | Category)[] = ["All", "Solid materials", "Liquid fuels", "Gaseous flames", "Smoke & detection"];
const SERIES = ["#1f97b3", "#d55181", "#b38a1f"];

const ROWS: { k: string; get: (i: Inv) => string }[] = [
  { k: "What it did", get: (i) => i.ai.summary },
  { k: "Fire-safety takeaway", get: (i) => i.ai.takeaway },
  { k: "Category", get: (i) => `${i.ai.category} · ${i.type === "flight" ? "flight" : "ground"}` },
  { k: "Fuel / material", get: (i) => i.ai.fuel },
  { k: "Sample / burner", get: (i) => i.ai.geometry },
  { k: "Oxygen", get: (i) => i.ai.o2 },
  { k: "Pressure", get: (i) => i.ai.pressure },
  { k: "Airflow", get: (i) => i.ai.flow },
  { k: "Diluent / suppressant", get: (i) => i.ai.diluent },
  { k: "Sensors & measurements", get: (i) => i.ai.sensors },
  { k: "Hardware", get: (i) => i.hardware || "—" },
  { k: "Test runs logged", get: (i) => (i.nTests ? i.nTests.toLocaleString() : "—") },
  { k: "Archive · papers", get: (i) => `${fmtSize(i.dataGB)} · ${i.pubs} pubs` },
];

export function Explore({ h, w, onOpen }: { h: Habitat; w: Weights; onOpen: (id: string) => void }) {
  const [cat, setCat] = useState<(typeof CATS)[number]>("All");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string[]>(["PSI-25", "PSI-20", "PSI-69"]);
  const [note, setNote] = useState("");

  const score = useMemo(() => Object.fromEntries(rank(h, w).map((r) => [r.inv.id, r.total])), [h, w]);
  const list = useMemo(() => {
    const s = q.toLowerCase();
    return INVS.filter((i) => (cat === "All" || i.ai.category === cat) && (!s || `${i.ai.name} ${i.title} ${i.ai.fuel} ${i.ai.summary} ${i.id}`.toLowerCase().includes(s))).sort(
      (a, b) => score[b.id] - score[a.id],
    );
  }, [cat, q, score]);

  useEffect(() => {
    if (!note) return;
    const id = setTimeout(() => setNote(""), 2600);
    return () => clearTimeout(id);
  }, [note]);

  const toggle = (id: string) => {
    if (sel.includes(id)) return setSel(sel.filter((y) => y !== id));
    if (sel.length < 3) return setSel([...sel, id]);
    setNote(`Replaced ${INV_BY_ID[sel[0]].ai.name} (max 3)`);
    setSel([...sel.slice(1), id]);
  };
  const chosen = sel.map((id) => INV_BY_ID[id]);

  const radar = useMemo<Opt>(
    () => ({
      tooltip: { ...tooltip, trigger: "item" },
      radar: {
        radius: "68%",
        center: ["50%", "52%"],
        indicator: CRITERIA.map((c) => ({ name: c.label, max: 5 })),
        axisName: { color: INK2, fontSize: 12 },
        splitLine: { lineStyle: { color: "#1c2333" } },
        splitArea: { areaStyle: { color: ["transparent"] } },
        axisLine: { lineStyle: { color: "#1c2333" } },
      },
      series: [
        {
          type: "radar",
          symbolSize: 5,
          data: chosen.map((i, k) => {
            const s = criterionScores(i, h);
            return { name: i.ai.name, value: CRITERIA.map((c) => +s[c.key].toFixed(2)), lineStyle: { color: SERIES[k], width: 2 }, itemStyle: { color: SERIES[k] }, areaStyle: { color: SERIES[k], opacity: 0.12 } };
          }),
        },
      ],
    }),
    [sel, h],
  );

  return (
    <section>
      <SectionHead
        id="explore"
        title={<>Compare investigations side by side</>}
        lede="Pick up to three from the list (sorted by relevance to the selected habitat) to compare objectives, test conditions, variables and sensors. The radar uses the same five scores as the SI ranking."
      />
      <div className="grid gap-3 lg:grid-cols-12">
        <Card className="lg:col-span-4" inner="p-0 flex flex-col">
          <div className="space-y-3 border-b border-white/[0.06] p-4">
            <label className="flex h-10 items-center gap-2 rounded-lg bg-white/[0.04] px-3 ring-1 ring-white/[0.07] focus-within:ring-ug/50">
              <MagnifyingGlass size={15} className="text-muted" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="Search investigations"
                placeholder="Search PMMA, CO₂, droplet, smoke…"
                className="h-full min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-muted"
              />
              {q && (
                <button onClick={() => setQ("")} aria-label="Clear search" className="-mr-2 grid h-8 w-8 place-items-center text-muted hover:text-ink">
                  <X size={13} />
                </button>
              )}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATS.map((c) => (
                <Chip key={c} active={cat === c} onClick={() => setCat(c)}>
                  {c}
                </Chip>
              ))}
            </div>
            <div className="num flex items-center justify-between text-[12px] text-muted">
              <span>{list.length} of {INVS.length}</span>
              <span className={note ? "text-warning" : ""}>{note || `${sel.length}/3 selected`}</span>
            </div>
          </div>
          <div className="relative flex-1 lg:min-h-[420px]">
          <ul className="max-h-[560px] overflow-y-auto p-2 lg:absolute lg:inset-0 lg:max-h-none" aria-label="Investigations">
            {list.map((i) => {
              const on = sel.includes(i.id);
              const k = sel.indexOf(i.id);
              return (
                <li key={i.id}>
                  <div className={`group flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors ${on ? "bg-white/[0.05]" : "hover:bg-white/[0.03]"}`}>
                    <button
                      onClick={() => toggle(i.id)}
                      aria-pressed={on}
                      aria-label={`${on ? "Remove" : "Add"} ${i.ai.name} ${on ? "from" : "to"} comparison`}
                      className="-m-1.5 grid h-8 w-8 shrink-0 place-items-center"
                    >
                      <span
                        className="grid h-5 w-5 place-items-center rounded-[5px] transition-colors"
                        style={on ? { background: SERIES[k], boxShadow: `inset 0 0 0 1px ${SERIES[k]}` } : { boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.22)" }}
                      >
                        {on && <Check size={12} weight="bold" className="text-bg" />}
                      </span>
                    </button>
                    <button onClick={() => toggle(i.id)} className="min-w-0 flex-1 text-left">
                      <span className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: PHASE_COLOR[i.ai.phase] }} />
                        <span className="truncate text-[13px] font-medium text-ink">{i.ai.name}</span>
                      </span>
                      <span className="num block truncate pl-3.5 text-[12px] text-muted">
                        {i.id} · {i.type} · {i.nTests || "—"} runs
                      </span>
                    </button>
                    <span className="num text-[12px] text-ink-2" title="Relevance score for the selected habitat (0–100)">
                      {Math.round(score[i.id])}
                    </span>
                    <button onClick={() => onOpen(i.id)} aria-label={`Open ${i.ai.name} details`} className="grid h-7 w-7 place-items-center rounded-md text-muted transition-colors hover:bg-white/[0.06] hover:text-ink">
                      <ArrowUpRight size={14} />
                    </button>
                  </div>
                </li>
              );
            })}
            {list.length === 0 && (
              <li className="px-3 py-10 text-center text-[13px] text-ink-2">
                No investigations match “{q}”{cat !== "All" ? ` in ${cat}` : ""}.
                <button
                  onClick={() => {
                    setQ("");
                    setCat("All");
                  }}
                  className="mt-2 block w-full text-[12.5px] text-ug hover:underline"
                >
                  Clear filters
                </button>
              </li>
            )}
          </ul>
          </div>
        </Card>

        <div className="grid min-w-0 content-start gap-3 lg:col-span-8">
          {chosen.length === 0 ? (
            <Card inner="p-10 text-center">
              <div className="text-[14px] font-medium">Nothing selected</div>
              <p className="mt-1 text-[13px] text-ink-2">Tick up to three investigations on the left to compare them here.</p>
            </Card>
          ) : (
            <>
              <Card delay={40} inner="p-4 md:p-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:items-center">
                <div>
                  <div className="text-[12px] font-medium text-ink-2">Score profile · {h.o2} % O₂ habitat</div>
                  <EChart option={radar} height={260} />
                </div>
                <ul className="grid gap-2">
                  {chosen.map((i, k) => (
                    <li key={i.id} className="flex items-center gap-3 rounded-lg bg-white/[0.03] px-3 py-2.5 ring-1 ring-white/[0.06]">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: SERIES[k] }} />
                      <button onClick={() => onOpen(i.id)} className="min-w-0 flex-1 text-left">
                        <span className="block truncate text-[13px] font-medium hover:text-ug">{i.ai.name}</span>
                        <span className="num block text-[12px] text-muted">{i.id} · {i.ai.category}</span>
                      </button>
                      <span className="num text-[15px] font-medium">{Math.round(score[i.id])}</span>
                      <button onClick={() => toggle(i.id)} className="grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-white/[0.06] hover:text-ink" aria-label={`Remove ${i.ai.name}`}>
                        <X size={13} />
                      </button>
                    </li>
                  ))}
                </ul>
              </Card>
              <Card delay={80} inner="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] border-collapse text-left text-[12.5px]">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        <th className="w-40 px-4 py-3 text-[12px] font-normal text-muted">Attribute</th>
                        {chosen.map((i, k) => (
                          <th key={i.id} className="px-4 py-3 align-top text-[13px] font-semibold">
                            <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: SERIES[k] }} />
                            {i.ai.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ROWS.map((r) => {
                        const vals = chosen.map(r.get);
                        const same = vals.length > 1 && vals.every((v) => v === vals[0]);
                        return (
                          <tr key={r.k} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.015]">
                            <td className="px-4 py-3 align-top text-[12px] text-muted">
                              {r.k}
                              {same && <span className="ml-1.5 text-[12px] text-muted">· same</span>}
                            </td>
                            {vals.map((v, k) => (
                              <td key={k} className="px-4 py-3 align-top leading-relaxed text-ink-2">
                                {v}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
