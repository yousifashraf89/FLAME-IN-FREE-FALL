import { useState } from "react";
import { DATA } from "../lib/data";
import { EXTRA, type BassOut } from "../lib/predict";
import { Card, Chip } from "../components/ui";
import { Label } from "./Risk";

// BASS (PSI-26): crews lit solids on the ISS, then changed or stopped the airflow and logged what the flame did.
const GROUPS: { id: string; label: string; color: string; outs: BassOut[] }[] = [
  { id: "kept", label: "Kept burning", color: "#ef5f5f", outs: ["kept"] },
  { id: "flow", label: "Went out when the airflow stopped", color: "#3db87c", outs: ["flow"] },
  { id: "n2", label: "Put out with nitrogen", color: "#6aa8ff", outs: ["n2"] },
  { id: "other", label: "Went out another way or never lit", color: "#5b6476", outs: ["other", "blown", "none"] },
];
const FAMILIES = [...new Set(EXTRA.bass.map((b) => b.family))].sort((a, b) => EXTRA.bass.filter((x) => x.family === b).length - EXTRA.bass.filter((x) => x.family === a).length);
const count = (fam: string | null, outs: BassOut[]) => EXTRA.bass.filter((b) => (!fam || b.family === fam) && outs.includes(b.out)).length;
const DOWN_TO_EXT = DATA.bass2.filter((b) => /ext/i.test(b.air ?? "")).length;

function Bar({ fam, active, onClick }: { fam: string | null; active: boolean; onClick: () => void }) {
  const total = count(fam, ["kept", "flow", "n2", "other", "blown", "none"]);
  return (
    <button onClick={onClick} aria-pressed={active} className={`grid w-full grid-cols-[minmax(0,150px)_1fr_32px] items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors ${active ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"}`}>
      <span className={`truncate text-[12.5px] ${active ? "text-ink" : "text-ink-2"}`}>{fam ?? "All materials"}</span>
      <span className="flex h-3 gap-[2px] overflow-hidden rounded-[4px]">
        {GROUPS.map((g) => {
          const n = count(fam, g.outs);
          return n ? <span key={g.id} title={`${g.label}: ${n}`} style={{ flex: n, background: g.color, opacity: active ? 1 : 0.7 }} /> : null;
        })}
      </span>
      <span className="num text-right text-[12px] text-muted">{total}</span>
    </button>
  );
}

export function Fans() {
  const [fam, setFam] = useState<string | null>(null);
  const total = count(fam, ["kept", "flow", "n2", "other", "blown", "none"]);
  const stopped = count(fam, ["flow"]);
  const kept = count(fam, ["kept"]);

  return (
    <section className="grid items-start gap-4 lg:grid-cols-[minmax(280px,340px)_1fr]">
      <div className="lg:sticky lg:top-[72px]">
        <Card inner="p-4 sm:p-5">
          <Label>Which material is burning?</Label>
          <div className="flex flex-wrap gap-1.5">
            <Chip text active={!fam} onClick={() => setFam(null)}>All</Chip>
            {FAMILIES.map((f) => <Chip text key={f} active={fam === f} onClick={() => setFam(f)}>{f}</Chip>)}
          </div>
          <p className="mt-4 text-[12.5px] leading-relaxed text-ink-2">
            On the ISS, a fan pushes air past everything. Turning it off sounds like a way to starve a fire. NASA's BASS experiment tested this: crews lit {EXTRA.bass.length} samples, then slowed or stopped the air and wrote down what the flame did.
          </p>
        </Card>
      </div>

      <div className="min-w-0 space-y-4">
        <div className="reveal relative overflow-hidden rounded-[22px] bg-[#0c111b] p-5 ring-1 ring-white/[0.08] sm:p-6">
          <div className="text-[12px] text-muted">{fam ?? "All materials"} · {total} BASS tests</div>
          <div className="mt-2 grid gap-5 sm:grid-cols-2">
            <div>
              <div className="num text-[40px] font-semibold leading-none tracking-tight text-good">{stopped}<span className="text-[20px] text-ink-2"> of {total}</span></div>
              <div className="mt-1.5 text-[13px] text-ink-2">went out when the crew stopped the airflow</div>
            </div>
            <div>
              <div className="num text-[40px] font-semibold leading-none tracking-tight text-critical">{kept}<span className="text-[20px] text-ink-2"> of {total}</span></div>
              <div className="mt-1.5 text-[13px] text-ink-2">kept burning until the sample burned out or the test ended</div>
            </div>
          </div>
          <p className="mt-5 border-t border-white/[0.07] pt-4 text-[13.5px] leading-relaxed text-ink">
            {stopped === 0 ? "In these tests, stopping the air never put this material out." : "Turning off the fans can help, but it is not reliable."} Use it to slow the fire, then use an extinguisher. It does nothing for a fuel leak: in NASA's BRE tests, flames fed by gas kept burning with no airflow at all at 21–40 % oxygen.
          </p>
        </div>

        <Card inner="p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-[14px] font-semibold">What happened in every BASS test</h3>
            <span className="text-[12px] text-muted">click a row</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-ink-2">
            {GROUPS.map((g) => (
              <span key={g.id} className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-[3px]" style={{ background: g.color }} />{g.label}</span>
            ))}
          </div>
          <div className="mt-3 space-y-0.5">
            <Bar fam={null} active={!fam} onClick={() => setFam(null)} />
            {FAMILIES.map((f) => <Bar key={f} fam={f} active={fam === f} onClick={() => setFam(f)} />)}
          </div>
        </Card>

        <Card inner="p-5">
          <h3 className="text-[14px] font-semibold">Slowing the air down, step by step</h3>
          <p className="mt-1.5 max-w-[70ch] text-[13px] leading-relaxed text-ink-2">
            The follow-up, BASS-II, ran {DATA.bass2.length} burns. In <span className="num text-ink">{DOWN_TO_EXT}</span> of them the crew turned the airflow down until the flame went out. Flames shrink and dim as the air slows, so a weak fan can matter as much as no fan.
          </p>
        </Card>
        <p className="text-[12px] text-muted">Data: {EXTRA.source.bass} BASS-II (PSI-25) airflow logs. ACME BRE (PSI-20) for gas-fed flames.</p>
      </div>
    </section>
  );
}
