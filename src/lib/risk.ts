// Fire risk check: one material, one place -> will the fire go out by itself, and why.
// Liquid fuel: nearest-neighbour vote over the 274 FLEX droplet burns (each one a real ISS test).
// Solids and gas leaks: PSI has no clean burn/no-burn label at habitat conditions, so they follow
// what the tests showed and say plainly when NASA has no data.
import EXTRA from "../data/extra.json";
import { DATA } from "./data";

export type Place = { id: string; name: string; o2: number; p: number; g: number; group: "Space" | "Earth"; habitat?: "iss" | "eva" | "moon" | "mars" };
export const PLACES: Place[] = [
  { id: "iss", name: "Space station (ISS)", o2: 21, p: 101.3, g: 0, group: "Space", habitat: "iss" },
  { id: "cargo", name: "Cygnus cargo ship (where NASA lit its Saffire fires)", o2: 21, p: 101.3, g: 0, group: "Space" },
  { id: "eva", name: "Spacewalk-prep cabin", o2: 26.5, p: 70.3, g: 0, group: "Space", habitat: "eva" },
  { id: "moon", name: "Moon base", o2: 34, p: 56.5, g: 0.16, group: "Space", habitat: "moon" },
  { id: "rover", name: "Pressurized lunar rover", o2: 34, p: 56.5, g: 0.16, group: "Space", habitat: "moon" },
  { id: "mars", name: "Mars base", o2: 30, p: 70.3, g: 0.38, group: "Space", habitat: "mars" },
  { id: "suit", name: "Spacesuit", o2: 100, p: 29.6, g: 0, group: "Space" },
  { id: "hospital", name: "Hospital bed with oxygen therapy", o2: 30, p: 101.3, g: 1, group: "Earth" },
  { id: "hyperbaric", name: "Hyperbaric chamber (pure oxygen)", o2: 100, p: 243, g: 1, group: "Earth" },
  { id: "plane", name: "Airliner cabin at cruise", o2: 21, p: 75, g: 1, group: "Earth" },
  { id: "sub", name: "Submarine", o2: 20, p: 101.3, g: 1, group: "Earth" },
];
export const gravityName = (g: number) => (g === 0 ? "weightless" : g === 1 ? "Earth gravity" : g < 0.3 ? "Moon gravity" : "Mars gravity");
export const psi = (kPa: number) => Math.round((kPa / 6.895) * 10) / 10;

export type State = "solid" | "liquid" | "gas";
type Material = { id: string; name: string; state: State; words: string[]; behaves?: "burns" | "resisted" | "smoke"; inv: string; evidence: string; duration: string };
const MATERIALS: Material[] = [
  { id: "cotton", name: "cotton-blend fabric", state: "solid", behaves: "burns", inv: "PSI-99", words: ["cotton", "fabric", "cloth", "clothes", "clothing", "towel", "shirt", "textile", "paper", "tissue", "wipe"], evidence: "Saffire-II: a cotton-fiberglass strip burned its full 29 cm length in microgravity at about 22 % oxygen.", duration: "Saffire: a 29 cm strip burned out in 115–145 s; a 94 cm sheet burned 70 s (air against the flame) to 420 s (air with the flame)." },
  { id: "acrylic", name: "acrylic (PMMA)", state: "solid", behaves: "burns", inv: "PSI-25", words: ["acrylic", "pmma", "plexiglass", "perspex", "plastic", "panel", "window", "display", "screen"], evidence: "BASS-II and Saffire-II: acrylic kept burning in microgravity at about 22 % oxygen.", duration: "Saffire-II: thick acrylic samples burned for 10 to 15 minutes (600–900 s)." },
  { id: "nomex", name: "Nomex fabric", state: "solid", behaves: "resisted", inv: "PSI-99", words: ["nomex", "flame resistant", "flame-resistant", "fire resistant", "fireproof", "aramid", "suit", "bag"], evidence: "Saffire-II: Nomex did not catch fire next to burning acrylic at about 22 % oxygen.", duration: "It did not keep burning in NASA's test." },
  { id: "silicone", name: "silicone rubber", state: "solid", behaves: "resisted", inv: "PSI-99", words: ["silicone", "rubber", "seal", "gasket", "hose", "o-ring"], evidence: "Saffire-II: four thin silicone samples barely burned in microgravity, though most burned fully on Earth.", duration: "Barely burned in microgravity (about 0 cm)." },
  { id: "kapton", name: "Kapton wire insulation", state: "solid", behaves: "smoke", inv: "PSI-101", words: ["kapton", "wire", "insulation", "cable", "polyimide"], evidence: "SAME-R only heated Kapton to study its smoke; NASA never set it on fire in these tests.", duration: "Not measured: NASA only heated it for smoke tests." },
  { id: "teflon", name: "Teflon (PTFE)", state: "solid", behaves: "smoke", inv: "PSI-101", words: ["teflon", "ptfe", "tubing", "jacket"], evidence: "SAME-R only heated Teflon to study its smoke; NASA never set it on fire in these tests.", duration: "Not measured: NASA only heated it for smoke tests." },
  { id: "foam", name: "foam padding", state: "solid", behaves: "smoke", inv: "PSI-101", words: ["foam", "pyrell", "padding", "cushion", "sponge", "mattress"], evidence: "SAME-R only heated Pyrell foam to study its smoke; NASA never set it on fire in these tests.", duration: "Not measured: NASA only heated it for smoke tests." },
  { id: "liquid", name: "liquid fuel", state: "liquid", inv: "PSI-69", words: ["ethanol", "methanol", "heptane", "alcohol", "fuel", "solvent", "gasoline", "petrol", "kerosene", "oil", "acetone", "cleaner", "liquid"], evidence: "", duration: "" },
  { id: "gas", name: "fuel gas", state: "gas", inv: "PSI-20", words: ["propane", "methane", "ethylene", "butane", "hydrogen", "natural gas", "gas", "leak"], evidence: "", duration: "" },
];

/** Match free text to the closest NASA-tested material, if any. */
export function matchMaterial(text: string): Material | null {
  const t = text.toLowerCase().trim();
  if (t.length < 2) return null;
  return MATERIALS.find((m) => m.words.some((w) => t.includes(w) || (t.length >= 4 && w.startsWith(t)))) ?? null;
}
const byState = (s: State) => MATERIALS.find((m) => m.state === s && (s !== "solid" || m.id === "cotton"))!;

// ---- liquid: k nearest FLEX burns in (O2, log pressure, suppressant) space ----
type FlexRow = (typeof DATA.flex)[number];
const FLEX = DATA.flex.filter((f): f is FlexRow & { p: number } => !!f.o2 && f.p != null);
const K = 15;
const dist = (o2: number, p: number, f: (typeof FLEX)[number]) => {
  const a = (o2 - f.o2 * 100) / 3; // 3 points of O2 ~ one unit
  const b = Math.log(p / f.p) / 0.3; // ~35 % pressure change ~ one unit
  const c = (f.co2 + f.he) * 10; // runs with added suppressant count as farther away
  return Math.sqrt(a * a + b * b + c * c);
};
const goesOut = (f: (typeof FLEX)[number]) => f.end === "Extinction";

function vote(o2: number, p: number, skip?: (typeof FLEX)[number]) {
  const near = FLEX.filter((f) => f !== skip).map((f) => ({ f, d: dist(o2, p, f) })).sort((x, y) => x.d - y.d).slice(0, K);
  const w = near.map((n) => 1 / (0.3 + n.d));
  const out = near.reduce((s, n, i) => s + (goesOut(n.f) ? w[i] : 0), 0) / w.reduce((s, x) => s + x, 0);
  return { out, near };
}
/** chance (0-1) that a burning fuel drop goes out by itself */
export const liquidOut = (o2: number, p: number) => vote(o2, p).out;

let acc: number | undefined; // leave-one-out accuracy, computed on first use
export function liquidAccuracy() {
  if (acc === undefined) acc = FLEX.filter((f) => (vote(f.o2 * 100, f.p, f).out >= 0.5) === goesOut(f)).length / FLEX.length;
  return acc;
}
export const FLEX_O2 = [Math.min(...FLEX.map((f) => f.o2 * 100)), Math.max(...FLEX.map((f) => f.o2 * 100))] as const;
const P_MIN = Math.min(...FLEX.map((f) => f.p));
const P_MAX = Math.max(...FLEX.map((f) => f.p));
// BASS logged cabin O₂ up to 22.7 %, a little above the BASS-II / Saffire points in the atmosphere table
const SOLID_MAX = Math.max(...DATA.atmosphere.filter((a) => a.phase === "solid").map((a) => a.o2), ...EXTRA.bass.map((b) => b.o2)); // 22.7
const clampPct = (x: number) => Math.min(95, Math.max(5, Math.round(x * 100)));

export type Level = "High" | "Medium" | "Low";
export type Assessment = {
  material: Material;
  matched: boolean;
  level: Level;
  out: { word: string; sub: string };
  duration: string;
  coverage: { score: number; word: "Good" | "Partial" | "Low" };
  why: string[];
  warnings: string[];
  tests: { inv: string; label: string }[];
  liquid: boolean;
};

// first 4 distinct evidence lines (many neighbours read the same)
const uniq = (t: { inv: string; label: string }[]) => t.filter((x, i) => t.findIndex((y) => y.label === x.label) === i).slice(0, 4);

export function assess(text: string, state: State, pl: Place, o2 = pl.o2): Assessment {
  const hit = matchMaterial(text);
  const material = hit && hit.state === state ? hit : byState(state);
  const matched = !!hit && hit.state === state;
  const warnings: string[] = [];
  if (pl.g > 0 && pl.g < 1) warnings.push(`Partial gravity (${pl.g} g): NASA has no fire data yet (LUCI and FM2 are planned). It may feed a flame more than microgravity does.`);
  if (pl.g === 1) warnings.push("These NASA tests were weightless. On Earth, rising hot air feeds the flame, so fires usually spread faster.");
  if (state === "solid" && !matched && text.trim()) warnings.push(`NASA has not tested "${text.trim()}". This uses ordinary cotton-blend fabric as a stand-in.`);
  const near = (phase: string) => DATA.atmosphere.filter((a) => a.mode === "ambient" && a.phase === phase && Math.abs(a.o2 - o2) <= 4 && Math.abs(a.p - pl.p) <= 20);
  const cover = (n: number) => {
    const score = Math.round(Math.min(100, (n / 30) * 100) * (pl.g > 0 ? 0.5 : 1)); // the tests were weightless
    return { score, word: score >= 60 ? ("Good" as const) : score >= 25 ? ("Partial" as const) : ("Low" as const) };
  };
  const raise = (l: Level, beyond: boolean): Level => (!beyond ? l : l === "Low" ? "Medium" : "High");

  if (state === "liquid") {
    const { out, near: nn } = vote(o2, pl.p);
    const beyond = o2 > FLEX_O2[1] + 1 || pl.p < P_MIN * 0.9 || pl.p > P_MAX * 1.1;
    const pct = clampPct(out);
    const base: Level = out >= 0.6 ? "Low" : out <= 0.4 ? "High" : "Medium";
    const tb = nn.map((n) => n.f.tb).filter((x): x is number => x != null).sort((a, b) => a - b);
    const kept = nn.filter((n) => !goesOut(n.f)).length;
    if (beyond) warnings.unshift(o2 > FLEX_O2[1] + 1 ? `NASA never burned fuel drops above ${FLEX_O2[1]} % oxygen, so this stretches past the data.` : `NASA's lowest test pressure for fuel drops was ${Math.round(P_MIN)} kPa; this place runs at ${pl.p} kPa.`);
    const why = [`Predicted chance the fire goes out by itself: ${pct} %, from the ${K} most similar of ${FLEX.length} NASA fuel-drop fires (${kept} of them kept burning).`];
    if (Math.abs(o2 - 21) >= 2) why.push(`In normal air (21 % oxygen) the same check gives ${clampPct(liquidOut(21, pl.p))} %. Oxygen is the main reason for the difference.`);
    if (beyond) why.push("Risk raised one level because NASA did not test these conditions.");
    const cov = cover(nn.filter((n) => n.d < 1.5).length * 2);
    return {
      material, matched, liquid: true,
      level: raise(base, beyond),
      out: { word: out >= 0.6 ? "Likely" : out <= 0.4 ? "Unlikely" : "Uncertain", sub: `${pct} % chance, from the ${K} most similar NASA fuel-drop fires` },
      duration: tb.length ? `NASA fuel drops (1–5 mm) burned for ${Math.round(tb[Math.floor(tb.length / 2)])} s typically (${tb[0]}–${tb[tb.length - 1]} s). A spill or leak burns as long as the fuel lasts.` : "As long as the fuel lasts.",
      coverage: beyond ? { score: Math.min(cov.score, 20), word: "Low" } : cov,
      why, warnings,
      tests: uniq(nn.map(({ f }) => ({ inv: "PSI-69", label: `${f.fuel} drop at ${Math.round(f.o2 * 100)} % oxygen, ${Math.round(f.p)} kPa${f.co2 || f.he ? ", suppressant added" : ""}: ${goesOut(f) ? "went out by itself" : f.end === "Completion" ? "burned all its fuel" : "burst while burning"}` }))),
    };
  }

  if (state === "gas") {
    const n = near("gas");
    return {
      material, matched, liquid: false, level: "High",
      out: { word: "No", sub: "Not while gas keeps flowing" },
      duration: "As long as the gas flows. Shutting off the supply is what stops it.",
      coverage: cover(n.length),
      why: ["A gas-leak flame is fed by the leak, so it never runs out of fuel by itself.", n.length ? `NASA ran ${n.length} gas flames close to these conditions, and they burned steadily.` : "NASA's gas flames burned steadily from about 15 % to 40 % oxygen."],
      warnings,
      tests: uniq(n.map((a) => ({ inv: a.inv, label: `${a.note}, ${a.o2} % oxygen, ${Math.round(a.p)} kPa` }))),
    };
  }

  // solids
  const tested = o2 <= SOLID_MAX + 0.5;
  const tests = [{ inv: material.inv, label: material.evidence }];
  const coverage = material.behaves === "smoke" ? { score: 0, word: "Low" as const } : cover(near("solid").length);
  if (!tested) warnings.unshift(`No NASA space fire test of a real cabin material used more than ${SOLID_MAX} % oxygen. This place runs at ${o2} %.`);
  if (material.behaves === "smoke")
    return { material, matched, liquid: false, level: "High", out: { word: "Unknown", sub: "NASA has never set it on fire" }, duration: material.duration, coverage, why: [material.evidence, "Without a fire test, treat it as able to burn: risk set to High as a precaution."], warnings, tests };
  if (material.behaves === "burns")
    return {
      material, matched, liquid: false, level: "High",
      out: { word: "Unlikely", sub: tested ? "It burned in NASA's space tests" : `It burned at 22 % oxygen; this place has ${o2} %` },
      duration: material.duration, coverage,
      why: tested ? [material.evidence] : [material.evidence, "More oxygen makes a material that already burns at 21 % burn faster and more easily."],
      warnings, tests,
    };
  return {
    material, matched, liquid: false, level: tested ? "Low" : "Medium",
    out: { word: tested ? "Likely" : "Unknown", sub: tested ? "It barely burned in NASA's space tests" : `It resisted at 22 % oxygen; never tested at ${o2} %` },
    duration: material.duration, coverage,
    why: tested ? [material.evidence] : [material.evidence, "Materials that resist fire at 22 % oxygen can burn in richer air. Risk raised one level because NASA did not test these conditions."],
    warnings, tests,
  };
}

export function actions(state: State, o2: number) {
  const out = [
    state === "gas" ? "Shut off the gas supply first: the flame lives as long as gas flows." : state === "liquid" ? "Stop the leak or seal the container." : "Cut power to the burning item and stop the fans in that area.",
    "Use the fire extinguisher on the source of the fire.",
    "Put on breathing masks and move everyone to clean air.",
  ];
  if (o2 > 23) out.push(`At ${o2} % oxygen, act fast: flames spread quicker than in normal air.`);
  return out;
}

export const METHOD = () =>
  `Liquid fuel uses the ${K} closest of ${FLEX.length} NASA fuel-drop fires (FLEX, on the ISS); closer tests count more. Tested on fires it had not seen, it was right ${Math.round(liquidAccuracy() * 100)} % of the time. Solid materials and gas leaks follow what NASA's tests showed, and say so when NASA has no data. Data coverage counts NASA tests within 4 points of oxygen and 20 kPa of pressure.`;
