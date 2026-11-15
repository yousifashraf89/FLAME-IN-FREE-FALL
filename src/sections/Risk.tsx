import { useMemo, useState, type ReactNode } from "react";
import { Airplane, ArrowRight, Bed, Boat, CaretRight, FirstAid, Jeep, Lightning, Moon, Package, Planet, PersonSimple, Rocket, SlidersHorizontal, type Icon } from "@phosphor-icons/react";
import { HABITATS, type Habitat } from "../data/ai";
import { label } from "../lib/data";
import { FLEX_O2, METHOD, PLACES, actions, assess, gravityName, liquidOut, matchMaterial, psi, type Level, type Place, type State } from "../lib/risk";
import { Card, Chip, Range, Segmented } from "../components/ui";
import { EChart, INK2, axis, tooltip, type Opt } from "../components/EChart";

const LEVEL: Record<Level, { text: string; glow: string; ring: string; say: string }> = {
  High: { text: "text-critical", glow: "rgba(239,95,95,0.16)", ring: "ring-critical/30", say: "A fire here could keep burning. Act fast." },
  Medium: { text: "text-warning", glow: "rgba(201,133,0,0.16)", ring: "ring-warning/30", say: "It may go out, or it may not. Don't wait to find out." },
  Low: { text: "text-good", glow: "rgba(61,184,124,0.14)", ring: "ring-good/30", say: "NASA's tests point to a fire that struggles to keep going." },
};
const ICON: Record<string, Icon> = { iss: Planet, cargo: Package, eva: Rocket, moon: Moon, rover: Jeep, mars: Planet, suit: PersonSimple, hospital: Bed, hyperbaric: FirstAid, plane: Airplane, sub: Boat };
export const SHORT: Record<string, string> = { iss: "ISS", cargo: "Cygnus cargo", eva: "Spacewalk prep", moon: "Moon base", rover: "Lunar rover", mars: "Mars base", suit: "Spacesuit", hospital: "Hospital O₂ bed", hyperbaric: "Hyperbaric room", plane: "Airliner", sub: "Submarine" };
const QUICK = ["Cotton", "Acrylic", "Nomex", "Wire insulation", "Ethanol", "Propane"];
export const field = "h-10 w-full rounded-xl bg-white/[0.04] px-3 text-[13.5px] text-ink outline-none ring-1 ring-white/[0.09] transition-shadow placeholder:text-muted focus:ring-ug/50";

export function Label({ n, children }: { n?: number; children: ReactNode }) {
  return (
    <div className="mb-2.5 flex items-center gap-2 text-[12.5px] font-medium text-ink-2">
      {n && <span className="num grid h-5 w-5 place-items-center rounded-full bg-white/[0.06] text-[11px] text-ink">{n}</span>}
      {children}
    </div>
  );
}

function Tile({ id, name, meta, active, onClick, Ico }: { id: string; name: string; meta: string; active: boolean; onClick: () => void; Ico: Icon }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      data-place={id}
      className={`group flex min-w-0 items-center gap-2.5 rounded-xl px-2.5 py-2 text-left ring-1 transition-all duration-300 ease-spring active:scale-[0.98] ${
        active ? "bg-ug/[0.12] ring-ug/45" : "bg-white/[0.025] ring-white/[0.07] hover:bg-white/[0.05] hover:ring-white/[0.14]"
      }`}
    >
      <Ico size={17} weight={active ? "fill" : "light"} className={`shrink-0 ${active ? "text-ug" : "text-muted group-hover:text-ink-2"}`} />
      <span className="min-w-0">
        <span className="block truncate text-[12.5px] font-medium leading-tight text-ink">{name}</span>
        <span className="num block truncate text-[11px] leading-tight text-muted">{meta}</span>
      </span>
    </button>
  );
}

export function Risk({ h, setH, onOpen }: { h: Habitat; setH: (h: Habitat) => void; onOpen: (id: string) => void }) {
  const [placeId, setPlaceId] = useState("");
  const [custom, setCustom] = useState({ o2: 25, psi: 10.2, g: 0 });
  const [text, setText] = useState("");
  const [state, setState] = useState<State | "">("");
  const [done, setDone] = useState(""); // the inputs that were confirmed
  const [o2x, setO2x] = useState<number | null>(null);
  const [compare, setCompare] = useState(false);

  const place: Place | null =
    placeId === "custom" ? { id: "custom", name: "your custom place", o2: custom.o2, p: Math.round(custom.psi * 6.895 * 10) / 10, g: custom.g, group: "Space" } : (PLACES.find((p) => p.id === placeId) ?? null);
  const hit = matchMaterial(text);
  const sig = JSON.stringify([placeId, custom, text.trim().toLowerCase(), state]);
  const ready = !!place && !!text.trim() && !!state;
  const shown = ready && done === sig;
  const stale = !!done && !shown; // inputs changed after the last check
  const o2 = o2x ?? place?.o2 ?? 21;
  const r = useMemo(() => (shown && place && state ? assess(text, state, place, o2) : null), [shown, place, state, text, o2]);
  const where = place ? (place.id === "custom" ? "your custom place" : `the ${SHORT[place.id]}`) : "";

  const choose = (id: string) => {
    setPlaceId(id);
    setO2x(null);
    const hab = HABITATS.find((x) => x.id === PLACES.find((p) => p.id === id)?.habitat);
    if (hab && hab.id !== h.id) setH(hab);
  };
  const type = (v: string) => {
    setText(v);
    const m = matchMaterial(v);
    if (m) setState(m.state);
  };

  const curve = useMemo<Opt | null>(() => {
    if (!r?.liquid || !place) return null;
    const xs = Array.from({ length: 51 }, (_, i) => 15 + i * 0.5);
    return {
      grid: { left: 52, right: 16, top: 16, bottom: 44 },
      tooltip: { ...tooltip, trigger: "axis", formatter: (p: any) => `${p[0].value[0]} % oxygen<br/><b>${Math.round(p[0].value[1])} %</b> chance it goes out by itself` },
      xAxis: axis("Oxygen (%)", { type: "value", min: 15, max: 40, interval: 5 }),
      yAxis: axis("% chance it goes out", { type: "value", min: 0, max: 100, interval: 25, nameGap: 38 }),
      series: [
        {
          type: "line",
          smooth: true,
          showSymbol: false,
          lineStyle: { color: "#6aa8ff", width: 2 },
          areaStyle: { color: "rgba(106,168,255,0.08)" },
          data: xs.map((x) => [x, liquidOut(x, place.p) * 100]),
          markArea: { silent: true, itemStyle: { color: "rgba(255,255,255,0.04)" }, label: { color: INK2, fontSize: 12, position: "insideTop" }, data: [[{ name: "Past NASA's tests", xAxis: FLEX_O2[1] }, { xAxis: 40 }]] },
          markLine: { silent: true, symbol: "none", label: { color: INK2, fontSize: 12, formatter: `${o2} %` }, lineStyle: { color: "#eef1f6", type: "solid", width: 1 }, data: [{ xAxis: o2 }] },
        },
      ],
    };
  }, [r?.liquid, place, o2]);

  return (
    <section className="grid items-start gap-4 lg:grid-cols-[minmax(320px,380px)_1fr]">
      <div className="lg:sticky lg:top-[72px]">
        <Card inner="p-4 sm:p-5 space-y-5">
          <div>
            <Label n={1}>Where are you?</Label>
            {(["Space", "Earth"] as const).map((g) => (
              <div key={g} className="mb-2.5">
                <div className="mb-1.5 text-[11.5px] text-muted">{g === "Space" ? "In space" : "On Earth"}</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {PLACES.filter((p) => p.group === g).map((p) => (
                    <Tile key={p.id} id={p.id} name={SHORT[p.id]} meta={`${p.o2}% · ${psi(p.p)} psi`} Ico={ICON[p.id]} active={placeId === p.id} onClick={() => choose(p.id)} />
                  ))}
                  {g === "Earth" && <Tile id="custom" name="Custom" meta="Your own values" Ico={SlidersHorizontal} active={placeId === "custom"} onClick={() => choose("custom")} />}
                </div>
              </div>
            ))}
            {placeId === "custom" && (
              <div className="grid grid-cols-3 gap-2 text-[11.5px] text-muted">
                <label>Oxygen %<input type="number" min={10} max={100} value={custom.o2} onChange={(e) => setCustom({ ...custom, o2: +e.target.value })} className={`${field} num mt-1 h-9`} /></label>
                <label>Pressure psi<input type="number" min={2} max={40} step={0.1} value={custom.psi} onChange={(e) => setCustom({ ...custom, psi: +e.target.value })} className={`${field} num mt-1 h-9`} /></label>
                <label>Gravity
                  <select value={custom.g} onChange={(e) => setCustom({ ...custom, g: +e.target.value })} className={`${field} mt-1 h-9 px-2`}>
                    <option value={0}>None</option><option value={0.16}>Moon</option><option value={0.38}>Mars</option><option value={1}>Earth</option>
                  </select>
                </label>
              </div>
            )}
          </div>

          <div>
            <Label n={2}>What could burn?</Label>
            <input value={text} onChange={(e) => type(e.target.value)} placeholder="Type a material or object" aria-label="Material" className={field} />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {QUICK.map((q) => (
                <Chip text key={q} active={text.toLowerCase() === q.toLowerCase()} onClick={() => type(q)}>{q}</Chip>
              ))}
            </div>
            {text.trim() && (
              <p className="mt-2 text-[12px] leading-snug text-ink-2">
                {hit ? <>Closest NASA test: <span className="text-ink">{hit.name}</span> ({label(hit.inv)})</> : <span className="text-warning">No NASA test for this exact material. Pick its state and we'll use the closest tested fuel.</span>}
              </p>
            )}
            <div className="mt-3 flex items-center gap-3">
              <span className="text-[12px] text-muted">It is a</span>
              <Segmented size="xs" value={state as State} onChange={setState} options={[{ value: "solid", label: "Solid" }, { value: "liquid", label: "Liquid" }, { value: "gas", label: "Gas" }]} />
            </div>
          </div>

          <div className="border-t border-white/[0.06] pt-4">
            <Label n={3}>Check and confirm</Label>
            <p className="min-h-[2.6em] text-[13px] leading-snug text-ink-2">
              {ready && place ? (
                <>
                  <span className="text-ink">{text.trim()}</span> ({state}) in <span className="text-ink">{where}</span>: {place.o2} % oxygen, {psi(place.p)} psi, {gravityName(place.g)}.
                </>
              ) : (
                "Pick a place, a material and its state."
              )}
            </p>
            <button
              disabled={!ready || shown}
              onClick={() => {
                setDone(sig);
                setO2x(null);
              }}
              className="group mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-flame text-[13.5px] font-semibold text-bg shadow-[0_10px_30px_-12px_rgba(255,122,61,0.8)] transition-all duration-300 ease-spring hover:-translate-y-px active:scale-[0.98] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-35 disabled:shadow-none"
            >
              {shown ? "Result is up to date" : stale ? "Update the result" : "Assess the risk"}
              {!shown && <ArrowRight size={14} weight="bold" className="transition-transform duration-300 group-hover:translate-x-0.5" />}
            </button>
          </div>
        </Card>
      </div>

      <div className="min-w-0 space-y-4">
        {!r && (
          <Card inner="p-6 sm:p-8">
            <div className="max-w-md">
              <div className="text-[18px] font-semibold tracking-tight">Could a fire here keep burning?</div>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">
                Choose a place and what could catch fire. We match it against real fires NASA lit on the ISS and give you the risk, whether it would go out by itself, and what to do.
              </p>
              <ol className="mt-5 space-y-2.5 text-[13px] text-ink-2">
                {["Pick where you are", "Type what could burn", "Confirm, then read the result"].map((s, i) => (
                  <li key={s} className="flex items-center gap-2.5">
                    <span className="num grid h-6 w-6 place-items-center rounded-full bg-white/[0.05] text-[11.5px] text-ink ring-1 ring-white/[0.08]">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
              {stale && <p className="mt-5 text-[12.5px] text-warning">You changed the inputs. Press "Update the result".</p>}
            </div>
          </Card>
        )}

        {r && place && (
          <>
            <div className={`reveal relative overflow-hidden rounded-[22px] bg-[#0c111b] p-5 ring-1 sm:p-6 ${LEVEL[r.level].ring}`}>
              <div aria-hidden className="pointer-events-none absolute -left-16 -top-24 h-64 w-64 rounded-full blur-3xl" style={{ background: LEVEL[r.level].glow }} />
              <div className="relative">
                <div className="text-[12px] text-muted">
                  {text.trim()} in {where} at {o2} % oxygen
                </div>
                <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className={`text-[34px] font-semibold leading-none tracking-tight ${LEVEL[r.level].text}`}>{r.level} risk</span>
                  <span className="text-[13.5px] text-ink-2">{LEVEL[r.level].say}</span>
                </div>
                <div className="mt-5 grid gap-4 border-t border-white/[0.07] pt-4 sm:grid-cols-3">
                  <div>
                    <div className="text-[12px] text-muted">Goes out by itself?</div>
                    <div className="mt-1 text-[17px] font-semibold">{r.out.word}</div>
                    <div className="mt-0.5 text-[12.5px] leading-snug text-ink-2">{r.out.sub}</div>
                  </div>
                  <div>
                    <div className="text-[12px] text-muted">How long it can burn</div>
                    <div className="mt-1 text-[13px] leading-snug text-ink">{r.duration}</div>
                  </div>
                  <div>
                    <div className="flex items-baseline justify-between text-[12px] text-muted">
                      NASA data coverage <span className="num text-ink">{r.coverage.score}/100</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                      <div className="h-full rounded-full bg-ug transition-[width] duration-700 ease-spring" style={{ width: `${Math.max(3, r.coverage.score)}%` }} />
                    </div>
                    <div className="mt-1.5 text-[12px] leading-snug text-ink-2">{r.coverage.word}: how close this case is to real NASA tests</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card inner="p-5">
                <h3 className="text-[14px] font-semibold">What to do</h3>
                <ol className="mt-3 space-y-2.5">
                  {actions(state as State, o2).map((a, i) => (
                    <li key={a} className="flex gap-2.5 text-[13.5px] leading-snug">
                      <span className="num grid h-5 w-5 shrink-0 place-items-center rounded-full bg-flame/15 text-[11px] text-flame">{i + 1}</span>
                      {a}
                    </li>
                  ))}
                </ol>
              </Card>
              <Card inner="p-5 space-y-3">
                <h3 className="text-[14px] font-semibold">Why</h3>
                <ul className="space-y-1.5 text-[13px] leading-relaxed text-ink-2">
                  {r.why.map((w) => (
                    <li key={w} className="flex gap-2"><span className="mt-[0.6em] h-1 w-1 shrink-0 rounded-full bg-muted" />{w}</li>
                  ))}
                  {r.warnings.map((w) => (
                    <li key={w} className="flex gap-2 text-warning"><Lightning size={13} weight="fill" className="mt-1 shrink-0" />{w}</li>
                  ))}
                </ul>
                {r.tests.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {r.tests.map((t) => (
                      <button key={t.label} onClick={() => onOpen(t.inv)} title={t.label} className="max-w-full truncate rounded-full bg-white/[0.04] px-2.5 py-1 text-left text-[12px] text-ink-2 ring-1 ring-white/[0.08] transition-colors hover:text-ink">
                        {t.label.startsWith(label(t.inv)) ? t.label : `${label(t.inv)}: ${t.label}`}
                      </button>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            <Card inner="p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <label htmlFor="whatif" className="text-[14px] font-semibold">What if the oxygen changed?</label>
                <div className="flex items-baseline gap-3">
                  {o2x !== null && <button onClick={() => setO2x(null)} className="text-[12.5px] text-ug hover:underline">Back to {place.o2} %</button>}
                  <span className="num text-[15px]">{o2} %</span>
                </div>
              </div>
              <Range id="whatif" min={15} max={40} step={0.5} value={Math.min(40, o2)} onChange={setO2x} className="mt-3" />
              <p className="mt-1 text-[12.5px] text-muted">
                {r.liquid ? "The curve is the chance a fuel fire goes out by itself at each oxygen level." : "NASA burned solid materials only up to 22.7 % oxygen, so higher levels read as untested."}
              </p>
              {curve && <div className="mt-2"><EChart option={curve} height={240} /></div>}
            </Card>

            <div>
              <button onClick={() => setCompare((c) => !c)} aria-expanded={compare} className="inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[13px] text-ink-2 ring-1 ring-white/[0.1] transition-colors hover:text-ink">
                <CaretRight size={12} className={`transition-transform duration-300 ${compare ? "rotate-90" : ""}`} /> Same material in every place
              </button>
              {compare && state && (
                <Card className="mt-2" inner="p-0 overflow-x-auto">
                  <table className="w-full text-left text-[13px]">
                    <thead className="text-[12px] text-muted">
                      <tr className="border-b border-white/[0.06]"><th className="px-4 py-2.5 font-normal">Place</th><th className="px-4 py-2.5 font-normal">Oxygen</th><th className="px-4 py-2.5 font-normal">Risk</th><th className="hidden px-4 py-2.5 font-normal sm:table-cell">Goes out by itself?</th></tr>
                    </thead>
                    <tbody>
                      {PLACES.map((p) => {
                        const x = assess(text, state, p);
                        return (
                          <tr key={p.id} className={`border-b border-white/[0.04] last:border-0 ${p.id === place.id ? "bg-white/[0.04]" : ""}`}>
                            <td className="px-4 py-2">{SHORT[p.id]}</td>
                            <td className="num px-4 py-2 text-ink-2">{p.o2} %</td>
                            <td className={`px-4 py-2 font-medium ${LEVEL[x.level].text}`}>{x.level}</td>
                            <td className="hidden px-4 py-2 text-ink-2 sm:table-cell">{x.out.word}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </Card>
              )}
            </div>

            <details className="group text-[12.5px] text-muted">
              <summary className="flex cursor-pointer list-none items-center gap-1.5 hover:text-ink-2 [&::-webkit-details-marker]:hidden">
                <CaretRight size={12} className="transition-transform duration-200 group-open:rotate-90" /> How this works
              </summary>
              <p className="mt-2 max-w-[75ch] leading-relaxed">{METHOD()}</p>
            </details>
          </>
        )}
        <p className="text-[12px] text-muted">Screening tool built from public NASA PSI data. It is not a certified flight procedure.</p>
      </div>
    </section>
  );
}
