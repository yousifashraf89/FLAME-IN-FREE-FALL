import { ArrowRight, ArrowUpRight, CaretRight, Lightning } from "@phosphor-icons/react";
import { FINDINGS, HABITAT_SHORT, type Habitat } from "../data/ai";
import { label, psiUrl } from "../lib/data";
import { Card, Chip, CountUp, Status } from "../components/ui";

// The finding that matters most for each habitat leads the Overview.
const LEAD: Record<string, number> = { moon: 0, eva: 0, iss: 2, mars: 5 };
export const leadIndex = (h: Habitat) => LEAD[h.id] ?? 0;

// O2 axis 10-40 %: tested solid-material range vs habitat targets
function O2Ruler({ h }: { h: Habitat }) {
  const x = (o: number) => `${((o - 10) / 30) * 100}%`;
  const marks = [
    { id: "iss", o: 21, l: "ISS" },
    { id: "eva", o: 26.5, l: "EVA prep" },
    { id: "moon", o: 34, l: "Moon base" },
  ];
  return (
    <div className="relative mt-1 h-16" role="img" aria-label="Solid-material microgravity tests span 13.6 to 22.7 percent oxygen, below the EVA-prep and Moon-base atmospheres">
      <div className="absolute inset-x-0 top-7 h-2 rounded-full bg-white/[0.05]" />
      <div className="absolute top-7 h-2 rounded-full bg-s2" style={{ left: x(13.6), width: `${((22.7 - 13.6) / 30) * 100}%` }} />
      <div className="num absolute left-0 top-0 whitespace-nowrap text-[12px] text-s2">
        <span className="hidden sm:inline">Cabin materials tested in space: </span>
        <span className="sm:hidden">Tested in space: </span>13.6–22.7 % O₂
      </div>
      {marks.map((m) => (
        <div key={m.o} className="absolute top-5 -translate-x-1/2" style={{ left: x(m.o) }}>
          <div className={`mx-auto w-px ${m.id === h.id ? "h-7 bg-ink" : "h-6"} ${m.o > 22.7 && m.id !== h.id ? "bg-critical" : m.id !== h.id ? "bg-ink-2" : ""}`} />
          <div className={`num mt-1 whitespace-nowrap text-[12px] ${m.id === h.id ? "font-medium text-ink" : m.o > 22.7 ? "text-critical" : "text-ink-2"}`}>
            <span className="hidden sm:inline">{m.l} </span>
            {m.o}%
          </div>
        </div>
      ))}
    </div>
  );
}

function Sources({ f, onOpen }: { f: (typeof FINDINGS)[number]; onOpen: (id: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {f.sources.map((s) => (
        <span key={s} className="inline-flex items-center">
          <Chip onClick={() => onOpen(s)}>{label(s)}</Chip>
          <a href={psiUrl(s)} target="_blank" rel="noreferrer" aria-label={`${label(s)} on NASA PSI`} title="Open the NASA PSI record" className="grid h-8 w-6 place-items-center text-muted hover:text-ug">
            <ArrowUpRight size={12} />
          </a>
        </span>
      ))}
      <a href={`#${f.anchor}`} aria-label={`Open the chart behind: ${f.title}`} className="ml-auto inline-flex min-h-8 items-center gap-1 text-[12px] text-ink-2 transition-colors hover:text-ug">
        See the chart <ArrowRight size={13} />
      </a>
    </div>
  );
}

function Action({ text }: { text: string }) {
  return (
    <p className="flex gap-2 border-t border-white/[0.06] pt-3 text-[13px] leading-snug text-ink">
      <Lightning size={15} weight="fill" className="mt-0.5 shrink-0 text-ug" />
      <span>{text}</span>
    </p>
  );
}

export function LeadFinding({ h, onOpen, className = "" }: { h: Habitat; onOpen: (id: string) => void; className?: string }) {
  const i = leadIndex(h);
  const f = FINDINGS[i];
  return (
    <Card className={className} inner="p-5 md:p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[12px] font-medium text-ink-2">Top finding for {HABITAT_SHORT[h.id]}</div>
        <Status tone={f.tone} />
      </div>
      <div className="flex flex-wrap items-end gap-x-5 gap-y-2">
        <div className="num text-5xl font-medium leading-none tracking-tight">
          <CountUp value={f.stat} />
        </div>
        <div className="max-w-[28ch] pb-1 text-[12.5px] leading-snug text-ink-2">{f.statLabel}</div>
      </div>
      <div>
        <h2 className="text-[20px] font-semibold leading-tight tracking-[-0.01em] [text-wrap:balance]">{f.title}</h2>
        <p className="mt-2 max-w-[70ch] text-[13.5px] leading-relaxed text-ink-2">{f.body}</p>
      </div>
      {i === 0 && <O2Ruler h={h} />}
      <div className="mt-auto space-y-3">
        <Action text={f.action} />
        <Sources f={f} onOpen={onOpen} />
      </div>
    </Card>
  );
}

export function FindingList({ h, onOpen }: { h: Habitat; onOpen: (id: string) => void }) {
  const lead = leadIndex(h);
  const rest = FINDINGS.map((f, i) => ({ f, i })).filter((x) => x.i !== lead);
  return (
    <Card delay={60} inner="p-0" className="scroll-mt-20">
      <div id="findings" className="flex items-baseline justify-between gap-3 border-b border-white/[0.06] px-5 py-3.5">
        <h2 className="text-[15px] font-semibold">More findings</h2>
        <span className="text-[12px] text-muted">From PSI tables and investigator conclusions · expand for the action</span>
      </div>
      <ul>
        {rest.map(({ f }) => (
          <li key={f.title} className="border-b border-white/[0.05] last:border-0">
            <details className="group">
              <summary className="grid cursor-pointer list-none grid-cols-[88px_1fr_auto_16px] items-center gap-4 px-5 py-3.5 transition-colors hover:bg-white/[0.02] [&::-webkit-details-marker]:hidden">
                <span className="num text-[22px] font-medium leading-none tracking-tight">
                  <CountUp value={f.stat} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[14px] font-medium leading-snug">{f.title}</span>
                  <span className="block truncate text-[12px] text-muted">{f.statLabel}</span>
                </span>
                <span className="hidden sm:block">
                  <Status tone={f.tone} />
                </span>
                <CaretRight size={14} className="text-muted transition-transform duration-200 group-open:rotate-90" />
              </summary>
              <div className="space-y-3 px-5 pb-4 sm:pl-[124px]">
                <p className="max-w-[75ch] text-[13px] leading-relaxed text-ink-2">{f.body}</p>
                <Action text={f.action} />
                <Sources f={f} onOpen={onOpen} />
              </div>
            </details>
          </li>
        ))}
      </ul>
    </Card>
  );
}
