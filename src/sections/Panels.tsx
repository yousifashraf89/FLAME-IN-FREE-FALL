import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, ChatCircleText, PaperPlaneTilt, X } from "@phosphor-icons/react";
import { FINDINGS, HABITAT_SHORT, type Habitat } from "../data/ai";
import { INVS, INV_BY_ID, PHASE_COLOR, PILLAR_COLOR, TOTALS, fmtSize, label, psiUrl, rank, type Weights } from "../lib/data";
import { Chip, Meter } from "../components/ui";

// Side panel: inert while closed, focus moves in on open and back to the trigger on close, page scroll locked.
function Overlay({ open, onClose, children, wide, label }: { open: boolean; onClose: () => void; children: React.ReactNode; wide?: boolean; label: string }) {
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const back = document.activeElement as HTMLElement | null;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const id = setTimeout(() => {
      const el = panel.current?.querySelector<HTMLElement>("[data-autofocus]") ?? panel.current?.querySelector<HTMLElement>("button, a, input");
      el?.focus();
    }, 60);
    return () => {
      clearTimeout(id);
      window.removeEventListener("keydown", k);
      document.body.style.overflow = prev;
      back?.focus?.();
    };
  }, [open, onClose]);
  return (
    <div inert={!open} className={`fixed inset-0 z-50 transition-opacity duration-300 ease-spring ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <aside
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={`absolute right-0 top-0 flex h-[100dvh] w-full flex-col bg-[#0b0f18] shadow-[-30px_0_80px_-20px_rgba(0,0,0,0.8)] ring-1 ring-white/10 transition-transform duration-500 ease-spring ${wide ? "md:w-[560px]" : "md:w-[520px]"} ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {children}
      </aside>
    </div>
  );
}

const year = (d: string | null | undefined) => (d ? (d.match(/\d{4}/)?.[0] ?? d) : "?");

export function Drawer({ id, h, w, onClose, onOpen }: { id: string | null; h: Habitat; w: Weights; onClose: () => void; onOpen: (id: string) => void }) {
  const [last, setLast] = useState(id);
  useEffect(() => void (id && setLast(id)), [id]);
  const i = last ? INV_BY_ID[last] : null;
  const ranked = useMemo(() => rank(h, w), [h, w]);
  const pos = i ? ranked.findIndex((r) => r.inv.id === i.id) : -1;
  return (
    <Overlay open={!!id} onClose={onClose} label={i ? `${i.ai.name} details` : "Investigation details"}>
      {i && (
        <>
          <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] p-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: PHASE_COLOR[i.ai.phase] }} />
                <span className="num text-[12px] text-muted">{i.id} · {i.type} · {i.ai.category}</span>
              </div>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight">{i.ai.name}</h3>
              <p className="mt-1 text-[13px] text-ink-2">{i.title}</p>
              {pos >= 0 && (
                <p className="num mt-3 inline-flex flex-wrap items-center gap-x-2 rounded-md bg-white/[0.04] px-2 py-1 text-[12px] text-ink-2 ring-1 ring-white/[0.07]">
                  <span className="text-ink">#{pos + 1}</span> of {ranked.length} for {HABITAT_SHORT[h.id]} · score {ranked[pos].total.toFixed(0)}/100 · habitat match {Math.round(ranked[pos].scores.habitat * 20)}%
                </p>
              )}
            </div>
            <button onClick={onClose} className="rounded-full p-2 text-ink-2 ring-1 ring-white/10 hover:text-ink" aria-label="Close"><X size={16} /></button>
          </div>
          <div className="flex-1 space-y-6 overflow-y-auto p-6 text-[13.5px] leading-relaxed">
            <div className="rounded-2xl bg-ug/[0.06] p-4 ring-1 ring-ug/15">
              <div className="text-[12px] font-medium text-ug">SI summary (AI-written)</div>
              <p className="mt-2 text-ink">{i.ai.summary}</p>
              <p className="mt-2 text-ink-2"><span className="text-ink">Why it matters:</span> {i.ai.takeaway}</p>
            </div>
            <div className="num grid grid-cols-3 gap-2 text-center">
              {[[i.nTests || "—", "test rows"], [i.pubs, "papers"], [fmtSize(i.dataGB), "archive"]].map(([v, l]) => (
                <div key={l as string} className="rounded-xl bg-white/[0.03] py-3 ring-1 ring-white/[0.06]"><div className="whitespace-nowrap text-lg">{v}</div><div className="text-[12px] font-medium text-ink-2">{l}</div></div>
              ))}
            </div>
            <div>
              <div className="text-[12px] font-medium text-ink-2">Scores (0–5)</div>
              <div className="mt-3 grid grid-cols-[130px_1fr] items-center gap-x-3 gap-y-2 text-[12.5px]">
                <span className="text-ink-2">Prevention</span><Meter value={i.ai.pillars.prevention} color={PILLAR_COLOR.prevention} />
                <span className="text-ink-2">Detection</span><Meter value={i.ai.pillars.detection} color={PILLAR_COLOR.detection} />
                <span className="text-ink-2">Suppression</span><Meter value={i.ai.pillars.suppression} color={PILLAR_COLOR.suppression} />
                <span className="text-ink-2">Material realism</span><Meter value={i.ai.scores.realism} color="#199e70" />
                <span className="text-ink-2">Model-ready</span><Meter value={i.ai.scores.model} color="#9085e9" />
              </div>
              <p className="mt-2 text-[12px] text-muted">{i.ai.rationale}</p>
            </div>
            <dl className="grid grid-cols-[120px_1fr] gap-x-3 gap-y-2 text-[12.5px]">
              {[["Fuel", i.ai.fuel], ["Sample", i.ai.geometry], ["Oxygen", i.ai.o2], ["Pressure", i.ai.pressure], ["Airflow", i.ai.flow], ["Diluent", i.ai.diluent], ["Sensors", i.ai.sensors], ["Hardware", i.hardware || "—"], ["Period", `${year(i.start)} → ${year(i.end)}`], ["Lead", i.pi || "—"]].map(([k, v]) => (
                <div key={k} className="contents"><dt className="text-muted">{k}</dt><dd className="text-ink-2">{v}</dd></div>
              ))}
            </dl>
            {[["Objective (PSI)", i.objective], ["Hypothesis (PSI)", i.hypothesis], ["Research impact (PSI)", i.impacts]].map(([k, v]) =>
              v ? (
                <details key={k} className="group rounded-xl bg-white/[0.02] p-4 ring-1 ring-white/[0.06]">
                  <summary className="cursor-pointer list-none text-[12px] text-muted group-open:text-ink">{k}</summary>
                  <p className="mt-2 text-[13px] text-ink-2">{v}</p>
                </details>
              ) : null,
            )}
            {i.related.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-[12px] text-muted">Related:</span>
                {i.related.filter((r) => INV_BY_ID[r]).map((r) => <Chip key={r} onClick={() => onOpen(r)}>{label(r)}</Chip>)}
              </div>
            )}
          </div>
          <div className="flex gap-2 border-t border-white/[0.06] p-4">
            <a href={psiUrl(i.id)} target="_blank" rel="noreferrer" className="group inline-flex flex-1 items-center justify-between rounded-full bg-ink py-1.5 pl-5 pr-1.5 text-[13px] font-medium text-bg">
              Open raw data in PSI
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-bg/10 transition-transform duration-500 ease-spring group-hover:translate-x-0.5 group-hover:-translate-y-[1px]"><ArrowUpRight size={14} /></span>
            </a>
            {i.doi && <a href={`https://doi.org/${i.doi}`} target="_blank" rel="noreferrer" className="rounded-full px-4 py-2 text-[13px] text-ink-2 ring-1 ring-white/10 hover:text-ink">DOI</a>}
          </div>
        </>
      )}
    </Overlay>
  );
}

// ---- Ask the SI analyst ----
type Msg = { role: "user" | "assistant"; content: string; offline?: boolean; refs?: string[] };
const SUGGEST = [
  "Which investigations matter most for a Moon base at 34 % O₂?",
  "Is shutting off ventilation enough to stop a fire in space?",
  "How do CO₂ and helium compare as suppressants?",
  "What data exists for spacecraft smoke detection?",
  "Do materials burn worse in microgravity than on Earth?",
];

const STOP = new Set("the a an of in on for to and or is are what which how do does with at by be it this that from as can i me my you we us our tell show please any there exist exists existing data test tests testing tested hi hello hey thanks thank why did does have has had was were when where who not about would could should will".split(" "));
const toks = (s: string) => s.toLowerCase().replace(/[^a-z0-9₂%. ]/g, " ").replace(/o₂/g, "o2").split(/\s+/).filter((t) => t.length > 1 && !STOP.has(t));

// offline SI: lexical retrieval over the same knowledge base the live model uses.
// Words are weighted by rarity (IDF), so ones found almost everywhere ("test", "fire", "flame") add ~nothing.
// exact token, or a shared stem of 4+ chars ("burn" ~ "burning"); short fragments like "re" never match
const hit = (x: string, w: string) => x === w || (Math.min(x.length, w.length) >= 4 && (x.startsWith(w) || w.startsWith(x)));
const DOCS = [
  ...FINDINGS.map((f) => ({ kind: "f" as const, f, t: new Set(toks(`${f.title} ${f.body} ${f.action}`)) })),
  ...INVS.map((i) => ({ kind: "i" as const, i, t: new Set(toks(`${i.id} ${i.ai.name} ${i.ai.category} ${i.ai.summary} ${i.ai.takeaway} ${i.ai.fuel} ${i.ai.o2} ${i.ai.diluent} ${i.ai.sensors}`)) })),
];
const has = (d: (typeof DOCS)[number], w: string) => [...d.t].some((x) => hit(x, w));
const MIN = 1.2; // about one word that appears in at most 1 in 3 documents

function offlineAnswer(q: string): Msg {
  const qt = [...new Set(toks(q))];
  const idf = Object.fromEntries(qt.map((w) => [w, Math.log(DOCS.length / Math.max(1, DOCS.filter((d) => has(d, w)).length))]));
  const scored = DOCS.map((d) => ({ d, s: qt.reduce((s, w) => s + (has(d, w) ? idf[w] : 0), 0) })).filter((x) => x.s >= MIN).sort((a, b) => b.s - a.s);
  const f = scored.find((x) => x.d.kind === "f");
  const inv = scored.filter((x) => x.d.kind === "i").slice(0, 3).map((x) => (x.d as Extract<(typeof DOCS)[number], { kind: "i" }>).i);
  if (!f && !inv.length)
    return { role: "assistant", offline: true, content: "Nothing in the knowledge base matches that closely. Try naming a topic the PSI data covers: oxygen level, a material (PMMA, Nomex, cotton), smoke detection, or CO₂ and helium suppression." };
  const parts = [];
  if (f && f.d.kind === "f") parts.push(`**${f.d.f.title}.** ${f.d.f.body}\n\n→ ${f.d.f.action}`);
  if (inv.length) parts.push("Matching investigations:\n" + inv.map((i) => `• **${i.ai.name} (${i.id})**: ${i.ai.takeaway}`).join("\n"));
  return { role: "assistant", content: parts.join("\n\n"), offline: true, refs: inv.map((i) => i.id) };
}

// Minimal markdown for model answers: **bold**, *italic*, `code`, "- " bullets, "#" headings.
function Inline({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|_[^_\s][^_]*_|`[^`]+`)/).map((s, j) =>
        s.startsWith("**") ? <strong key={j} className="font-semibold text-ink">{s.slice(2, -2)}</strong>
        : /^[*_].+[*_]$/.test(s) ? <em key={j}>{s.slice(1, -1)}</em>
        : s.startsWith("`") ? <span key={j}>{s.slice(1, -1)}</span>
        : s,
      )}
    </>
  );
}

function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((raw, k) => {
        const line = raw.trimEnd();
        const bullet = line.match(/^\s*(?:[-*•]|\d+\.)\s+(.*)$/);
        const head = line.match(/^#{1,4}\s+(.*)$/);
        if (bullet)
          return (
            <p key={k} className="flex gap-2 pl-1">
              <span className="mt-[0.6em] h-1 w-1 shrink-0 rounded-full bg-ink-2" aria-hidden />
              <span><Inline text={bullet[1]} /></span>
            </p>
          );
        if (head) return <p key={k} className="pt-1 font-semibold text-ink"><Inline text={head[1]} /></p>;
        if (/^\s*([-*_])\1{2,}\s*$/.test(line)) return null; // horizontal rules
        return <p key={k} className={line.trim() ? "" : "h-2"}><Inline text={line} /></p>;
      })}
    </>
  );
}

export function AskSI({ open, h, onClose, onOpen }: { open: boolean; h: Habitat; onClose: () => void; onOpen: (id: string) => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs]);

  async function send(q: string) {
    q = q.trim();
    if (!q || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: q }];
    setMsgs([...next, { role: "assistant", content: "" }]); // pending bubble right away
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ habitat: `${h.name}: ${h.o2}% O2 at ${h.psi} psi`, messages: next.map(({ role, content }) => ({ role, content })) }) });
      if (!res.ok || !res.body || !(res.headers.get("content-type") ?? "").startsWith("text/plain")) throw new Error("offline");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setMsgs([...next, { role: "assistant", content: acc }]);
      }
    } catch {
      setMsgs([...next, offlineAnswer(q)]);
    }
    setBusy(false);
  }

  return (
    <Overlay open={open} onClose={onClose} wide label="Ask the data">
      <div className="flex items-center justify-between border-b border-white/[0.06] p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.05] text-ink-2 ring-1 ring-white/10"><ChatCircleText size={18} weight="light" /></span>
          <div>
            <div className="font-semibold tracking-tight">Ask the data</div>
            <div className="text-[12px] text-muted">Grounded in {TOTALS.investigations} PSI investigations · answering for {HABITAT_SHORT[h.id]}</div>
          </div>
        </div>
        <button onClick={onClose} className="rounded-full p-2 text-ink-2 ring-1 ring-white/10 hover:text-ink" aria-label="Close"><X size={16} /></button>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-5 text-[13.5px] leading-relaxed">
        {msgs.length === 0 && (
          <div>
            <p className="text-ink-2">Ask anything about microgravity fire behavior, materials, detection or suppression. Try:</p>
            <div className="mt-4 flex flex-col gap-2">
              {SUGGEST.map((s) => (
                <button key={s} onClick={() => send(s)} className="rounded-2xl bg-white/[0.03] px-4 py-3 text-left text-[13px] text-ink ring-1 ring-white/[0.07] transition-all duration-300 ease-spring hover:bg-white/[0.06] active:scale-[0.99]">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {msgs.map((m, k) =>
          m.role === "user" ? (
            <div key={k} className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-bg">{m.content}</div>
          ) : (
            <div key={k} className="max-w-[95%] space-y-1 rounded-2xl rounded-bl-md bg-white/[0.04] px-4 py-3 text-ink-2 ring-1 ring-white/[0.07]">
              {m.content ? <Rich text={m.content} /> : <span className="inline-flex items-center gap-2 text-muted"><span className="flex gap-1">{[0, 1, 2].map((d) => <span key={d} className="h-1.5 w-1.5 animate-pulse rounded-full bg-ug/80" style={{ animationDelay: `${d * 120}ms` }} />)}</span>Reading the PSI records</span>}
              {m.refs && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {m.refs.map((r) => <Chip key={r} onClick={() => onOpen(r)}>{label(r)}</Chip>)}
                </div>
              )}
              {m.offline && <div className="pt-2 text-[12px] text-muted">Live model unavailable, so this was matched by keyword from the knowledge base.</div>}
            </div>
          ),
        )}
        {msgs.length > 0 && !busy && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {SUGGEST.filter((s) => !msgs.some((m) => m.content === s)).slice(0, 3).map((s) => (
              <button key={s} onClick={() => send(s)} className="rounded-full bg-white/[0.03] px-3 py-1.5 text-left text-[12px] text-ink-2 ring-1 ring-white/[0.07] transition-colors hover:bg-white/[0.06] hover:text-ink">
                {s}
              </button>
            ))}
            <button onClick={() => setMsgs([])} className="rounded-full px-3 py-1.5 text-[12px] text-muted transition-colors hover:text-ink">
              Clear chat
            </button>
          </div>
        )}
        <div ref={end} />
      </div>
      <form onSubmit={(e) => (e.preventDefault(), send(input))} className="flex items-center gap-2 border-t border-white/[0.06] p-4">
        <input value={input} onChange={(e) => setInput(e.target.value)} data-autofocus aria-label="Your question" placeholder="Ask about oxygen, materials, smoke or suppression" className="flex-1 rounded-full bg-white/[0.04] px-5 py-3 text-[13.5px] text-ink outline-none ring-1 ring-white/[0.08] placeholder:text-muted focus:ring-ug/40" />
        <button disabled={busy} className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-bg transition-transform duration-300 ease-spring active:scale-90 disabled:opacity-40" aria-label="Send">
          <PaperPlaneTilt size={16} weight="light" />
        </button>
      </form>
    </Overlay>
  );
}
