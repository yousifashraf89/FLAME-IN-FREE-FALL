// "Will it go out?": nearest-neighbour votes over real ISS tests.
// Fuel drop -> FLEX (PSI-69, 273 drops). Gas flame -> ACME CFI-G (PSI-159, 132 normal flames that lit).
// Each answer comes with the closest real tests; accuracy is measured leave-one-out.
import { DATA } from "./data";
import raw from "../data/extra.json";

export type BassOut = "kept" | "flow" | "other" | "n2" | "blown" | "none";
export const EXTRA = raw as {
  source: Record<"bass" | "cool" | "gas", string>;
  bass: { test: string; material: string; family: string; o2: number; p: number; out: BassOut }[];
  cool: { p: number; d: number; kind: "hot" | "cool" }[];
  gas: { fuel: string; o2: number; p: number; m: number; burn: number | null; out: boolean }[];
};

export type Row = { o2: number; p: number; key: string; m?: number; out: boolean; time: number | null; label: string };
export type Prediction = { out: number; time: number | null; near: Row[]; n: number; outside: string | null };
type Q = { o2: number; p: number; key: string; m?: number };

// K and scales picked by leave-one-out search; other fuels count as farther away
function model(rows: Row[], what: string, K: number, fuelGap: number) {
  const knn = (q: Q, skip?: Row) => {
    const near = rows
      .filter((r) => r !== skip)
      .map((r) => {
        const a = (q.o2 - r.o2) / 3; // 3 points of O2 ~ one unit
        const b = Math.log(q.p / r.p) / 0.5;
        const c = q.m && r.m ? Math.log(q.m / r.m) / 0.2 : 0; // fuel flow matters most for gas flames
        return { r, d: Math.sqrt(a * a + b * b + c * c + (r.key === q.key ? 0 : fuelGap)) };
      })
      .sort((x, y) => x.d - y.d)
      .slice(0, K);
    const w = near.map((n) => 1 / (0.3 + n.d));
    const out = near.reduce((s, n, i) => s + (n.r.out ? w[i] : 0), 0) / w.reduce((s, x) => s + x, 0);
    const times = near.map((n) => n.r.time).filter((t): t is number => t != null).sort((x, y) => x - y);
    return { out, time: times.length ? times[times.length >> 1] : null, near: near.map((n) => n.r) };
  };
  const span = (f: (r: Row) => number) => [Math.min(...rows.map(f)), Math.max(...rows.map(f))];
  const range = { o2: span((r) => r.o2), p: span((r) => r.p) };
  let acc: number | undefined;
  return {
    rows,
    range,
    predict(q: Q): Prediction {
      const outside =
        q.o2 > range.o2[1] + 1 || q.o2 < range.o2[0] - 1
          ? `NASA ran ${what} only between ${Math.round(range.o2[0])} and ${Math.round(range.o2[1])} % oxygen, so this stretches past the data.`
          : q.p > range.p[1] * 1.1 || q.p < range.p[0] * 0.9
            ? `NASA ran ${what} only between ${Math.round(range.p[0])} and ${Math.round(range.p[1])} kPa, so this stretches past the data.`
            : null;
      return { ...knn(q), n: rows.filter((x) => x.key === q.key).length, outside };
    },
    /** chance (%) it goes out, across oxygen levels */
    curve: (q: Q, from: number, to: number) =>
      Array.from({ length: Math.round((to - from) * 2) + 1 }, (_, i) => from + i / 2).map((x) => [x, Math.round(knn({ ...q, o2: x }).out * 100)]),
    accuracy() {
      if (acc === undefined) acc = rows.filter((r) => (knn(r, r).out >= 0.5) === r.out).length / rows.length;
      return acc;
    },
    /** share of tests where the more common outcome happened: the bar a model must beat */
    baseline: () => Math.max(...[true, false].map((v) => rows.filter((r) => r.out === v).length)) / rows.length,
  };
}

export const DROP_FUELS = ["Heptane", "Methanol"] as const;
export const SUPPRESSANT = { none: "", co2: "+co2", he: "+he" } as const;
export const drop = model(
  DATA.flex
    .filter((f) => f.p != null && f.o2)
    .map((f) => ({
      o2: f.o2 * 100,
      p: f.p!,
      key: f.fuel + (f.co2 ? "+co2" : f.he ? "+he" : ""), // runs with added suppressant only match each other
      out: f.end === "Extinction",
      time: f.tb,
      label: `${f.fuel} drop, ${Math.round(f.o2 * 100)} % O₂, ${Math.round(f.p!)} kPa${f.co2 ? ", CO₂ added" : f.he ? ", helium added" : ""}`,
    })),
  "fuel drops",
  15,
  4,
);

export const GAS_FUELS = ["ethane", "propane", "butane", "30% ethane", "30% propane", "30% butane", "50% butane"] as const;
export const gasName = (f: string) => {
  const [a, b] = f.split(" ");
  return b ? `${b[0].toUpperCase() + b.slice(1)} (${a} in nitrogen)` : a[0].toUpperCase() + a.slice(1);
};
export const gas = model(
  EXTRA.gas.map((c) => ({
    o2: c.o2,
    p: c.p,
    m: c.m,
    key: c.fuel,
    out: c.out,
    time: c.burn,
    label: `${gasName(c.fuel)}, ${Math.round(c.o2)} % O₂, ${Math.round(c.p)} kPa, ${c.m} mg/s`,
  })),
  "gas flames",
  9,
  1,
);
