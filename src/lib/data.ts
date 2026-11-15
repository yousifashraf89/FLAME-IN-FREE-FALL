import raw from "../data/psi.json";
import { AI_BY_ID, type Habitat, type InvAI } from "../data/ai";

export interface Investigation {
  id: string;
  acronym: string | null;
  title: string;
  type: "flight" | "ground";
  subArea: string;
  hardware: string;
  start: string | null;
  end: string | null;
  pi: string;
  dataGB: number;
  pubs: number;
  related: string[];
  doi: string;
  objective: string;
  hypothesis: string;
  approach: string;
  impacts: string;
  tables: string[];
  nTests: number;
}
export interface AtmoPoint { inv: string; o2: number; p: number; mode: "ambient" | "oxidizer"; phase: string; note: string; assumedP?: boolean }
export interface FlexRow { fuel: string; p: number | null; o2: number; co2: number; he: number; d0: number | null; dExt: number | null; k: number | null; tb: number | null; end: string }
export interface CfigRow { kind: "normal" | "inverse"; fuel: string; xo2: number | null; p: number | null; hot: boolean; cool: boolean; burn: number | null; end: string }
export interface SaffireRow { mission: string; sample: string; material: string; thick: string; flow: number | null; dir: string; o2?: string; burnTime?: number | null; ugBurn?: string; ugSpread?: string; gBurn?: string; gSpread?: string }
export interface SameRow { material: string; desc: string; v: number | null; growth: number | null; aging: number | null }

export const DATA = raw as unknown as {
  source: string;
  investigations: Investigation[];
  atmosphere: AtmoPoint[];
  flex: FlexRow[];
  cfig: CfigRow[];
  saffire: SaffireRow[];
  same: SameRow[];
  bass2: { test: string; material: string; family: string; o2i: number | null; o2f: number | null; air: string | null }[];
};

export type Inv = Investigation & { ai: InvAI };
export const INVS: Inv[] = DATA.investigations.map((i) => ({ ...i, ai: AI_BY_ID[i.id] }));
export const INV_BY_ID: Record<string, Inv> = Object.fromEntries(INVS.map((i) => [i.id, i]));
export const label = (id: string) => INV_BY_ID[id]?.ai.name ?? id;

export const TOTALS = {
  investigations: INVS.length,
  flight: INVS.filter((i) => i.type === "flight").length,
  tests: INVS.reduce((s, i) => s + i.nTests, 0),
  tb: INVS.reduce((s, i) => s + i.dataGB, 0) / 1000,
  pubs: INVS.reduce((s, i) => s + i.pubs, 0),
};

// ---- habitat match (computed from the tested atmospheres) ----
const pointsByInv: Record<string, { o2: number; p: number }[]> = {};
for (const p of DATA.atmosphere) if (p.mode === "ambient") (pointsByInv[p.inv] ??= []).push(p);

export function invPoints(id: string): { o2: number; p: number }[] {
  const inv = INV_BY_ID[id];
  return pointsByInv[id] ?? inv.ai.atmo ?? (inv.ai.inherits ?? []).flatMap((x) => invPoints(x));
}

/** 0-1: how close the investigation's closest tested atmosphere is to the habitat */
export function habitatMatch(id: string, h: Habitat): number {
  let best = 0;
  for (const pt of invPoints(id)) {
    const d = ((pt.o2 - h.o2) / 4) ** 2 + ((pt.p - h.p) / 18) ** 2;
    best = Math.max(best, Math.exp(-d));
  }
  return best;
}

export const inZone = (pt: { o2: number; p: number }, h: Habitat) => Math.abs(pt.o2 - h.o2) <= 4 && Math.abs(pt.p - h.p) <= 20;

// ---- SI ranking ----
export const CRITERIA = [
  { key: "safety", label: "Fire-safety relevance", hint: "How directly it informs prevention, detection or suppression. AI-written score.", ai: true },
  { key: "habitat", label: "Habitat match", hint: "How close the tested oxygen and pressure are to the selected habitat. Computed from the data." },
  { key: "realism", label: "Material realism", hint: "Real cabin materials rather than lab fuels. AI-written score.", ai: true },
  { key: "model", label: "Model-ready data", hint: "Numbers a fire model can be checked against. AI-written score.", ai: true },
  { key: "depth", label: "Data depth", hint: "Test runs, papers and archive size. Computed from the data." },
] as const;
export type CriterionKey = (typeof CRITERIA)[number]["key"];
export type Weights = Record<CriterionKey, number>;
export const DEFAULT_WEIGHTS: Weights = { safety: 3, habitat: 2, realism: 2, model: 1, depth: 1 };
// weights travel in the URL as five digits, e.g. w=32211
export const encodeWeights = (w: Weights) => CRITERIA.map((c) => w[c.key]).join("");
export function decodeWeights(s: string | null): Weights | null {
  if (!s || !/^[0-5]{5}$/.test(s)) return null;
  return Object.fromEntries(CRITERIA.map((c, i) => [c.key, +s[i]])) as Weights;
}
export const fmtSize = (gb: number) => (gb >= 1000 ? `${(gb / 1000).toFixed(1)} TB` : gb >= 1 ? `${gb.toFixed(0)} GB` : `${(gb * 1000).toFixed(0)} MB`);
export const PILLAR_COLOR = { prevention: "#d95926", detection: "#c98500", suppression: "#3987e5" } as const;

const log = (x: number, max: number) => Math.min(1, Math.log10(x + 1) / Math.log10(max + 1));
export function depthScore(i: Investigation) {
  return 5 * (0.5 * log(i.nTests, 400) + 0.3 * Math.min(1, i.pubs / 40) + 0.2 * log(i.dataGB, 2000));
}

export function criterionScores(i: Inv, h: Habitat): Record<CriterionKey, number> {
  return {
    safety: i.ai.scores.safety,
    habitat: 5 * habitatMatch(i.id, h),
    realism: i.ai.scores.realism,
    model: i.ai.scores.model,
    depth: depthScore(i),
  };
}

export function rank(h: Habitat, w: Weights) {
  const total = Object.values(w).reduce((a, b) => a + b, 0) || 1;
  return INVS.map((i) => {
    const s = criterionScores(i, h);
    const parts = Object.fromEntries(CRITERIA.map((c) => [c.key, (w[c.key] * s[c.key] * 20) / total])) as Record<CriterionKey, number>;
    return { inv: i, scores: s, parts, total: Object.values(parts).reduce((a, b) => a + b, 0) };
  }).sort((a, b) => b.total - a.total);
}

export const PHASE_COLOR: Record<string, string> = { solid: "#d95926", liquid: "#3987e5", gas: "#199e70", aerosol: "#9085e9" };
export const PHASE_LABEL: Record<string, string> = { solid: "Solid materials", liquid: "Liquid fuels", gas: "Gaseous flames", aerosol: "Smoke / aerosol" };
export const psiUrl = (id: string) => `https://psi.nasa.gov/physci/repo/data/investigations/${id}`;
