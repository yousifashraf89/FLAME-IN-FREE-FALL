import { useEffect, useState, type ReactNode } from "react";
import { Bell, BookOpenText, CaretDoubleLeft, Fan, FireSimple, ChatCircleText, Check, Columns, Compass, Fire, FireExtinguisher, Flask, LinkSimple, ShieldCheck, ListNumbers, Planet, Question, SidebarSimple, SquaresFour, type Icon } from "@phosphor-icons/react";
import { LogoMark } from "../components/Logo";
import { BranchedNav, type BranchGroup } from "../components/BranchedNav";
import type { Habitat } from "../data/ai";
import { DATA, TOTALS } from "../lib/data";
import { HabitatPicker } from "./Atmosphere";

export type View = "risk" | "predict" | "fans" | "lessons" | "overview" | "atmosphere" | "ranking" | "explore" | "evidence" | "gaps";

export const VIEWS: { id: View; label: string; Icon: Icon; title: string; sub: string }[] = [
  { id: "risk", label: "Fire risk check", Icon: Fire, title: "Fire risk check", sub: "Pick a place and what is on board: what could keep burning?" },
  { id: "predict", label: "Will it go out?", Icon: FireSimple, title: "Will it go out by itself?", sub: "Predict a flame from real ISS fire tests" },
  { id: "fans", label: "Turn off the fans?", Icon: Fan, title: "Will turning off the fans help?", sub: "What happened when crews stopped the airflow on burning samples" },
  { id: "overview", label: "Overview", Icon: SquaresFour, title: "Overview", sub: "The main findings for the selected habitat" },
  { id: "atmosphere", label: "Oxygen map", Icon: Planet, title: "Oxygen map", sub: "NASA fire tests by oxygen and pressure, next to each habitat" },
  { id: "ranking", label: "Ranking", Icon: ListNumbers, title: "Most relevant investigations", sub: "Choose what matters, the order updates live" },
  { id: "explore", label: "Compare", Icon: Columns, title: "Compare investigations", sub: "Pick up to three, side by side" },
  { id: "evidence", label: "What protects the crew", Icon: Flask, title: "What protects the crew", sub: "Prevention, detection and suppression, from NASA test data" },
  { id: "gaps", label: "Gaps", Icon: Compass, title: "What NASA hasn't tested yet", sub: "Where the data runs out, and what to test next" },
  { id: "lessons", label: "Past fires", Icon: BookOpenText, title: "Lessons from past fires", sub: "Apollo 1, Apollo 13, Mir and Saffire, tied to the data" },
];

const GLOSSARY: [string, string][] = [
  ["SI", "Super intelligence, the challenge's term for AI. Here: summaries, scores and findings written by an AI model from the PSI records. Every finding cites its sources."],
  ["PSI-xx", "Investigation ID in NASA's Physical Sciences Informatics archive. Click any one to open its record."],
  ["Microgravity", "The near-weightless condition on the ISS (sometimes written µg). 1 g is Earth gravity; the Moon is 0.16 g, Mars 0.38 g."],
  ["O₂ %", "Oxygen concentration in the atmosphere. Exploration habitats raise it while lowering pressure."],
  ["psi / kPa", "Cabin pressure. 14.7 psi (101.3 kPa) is sea level."],
  ["Match zone", "Tests within ±4 % O₂ and ±20 kPa of the selected habitat."],
  ["P · D · S", "Fire-safety pillars: prevention, detection, suppression (scored 0–5)."],
];

function Glossary() {
  return (
    <>
      <button
        popoverTarget="glossary"
        aria-label="Glossary"
        title="Glossary"
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-2 ring-1 ring-white/[0.08] transition-colors hover:bg-white/[0.05] hover:text-ink"
      >
        <Question size={15} />
      </button>
      <div
        id="glossary"
        popover="auto"
        className="fixed inset-auto right-4 top-14 m-0 w-[min(360px,calc(100vw-2rem))] rounded-xl bg-[#0e131e] p-4 text-ink shadow-[0_24px_60px_-12px_rgba(0,0,0,0.8)] ring-1 ring-white/10"
      >
        <div className="text-[13px] font-semibold">Glossary</div>
        <dl className="mt-3 grid grid-cols-[76px_1fr] gap-x-3 gap-y-2.5 text-[12.5px] leading-snug">
          {GLOSSARY.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="num text-ug">{k}</dt>
              <dd className="text-ink-2">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </>
  );
}

function ShareLink() {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      setDone(true);
      setTimeout(() => setDone(false), 1600);
    } catch {}
  };
  return (
    <button
      onClick={copy}
      title="Copy a link to this exact view"
      aria-label={done ? "Link copied" : "Copy a link to this view"}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center gap-1.5 rounded-full text-[12.5px] text-ink-2 ring-1 ring-white/[0.08] transition-colors hover:bg-white/[0.05] hover:text-ink lg:w-auto lg:px-3"
    >
      {done ? <Check size={14} className="text-good" /> : <LinkSimple size={14} />}
      <span className="hidden lg:inline" aria-live="polite">{done ? "Copied" : "Share view"}</span>
    </button>
  );
}

function NavItem({ v, active, mini }: { v: (typeof VIEWS)[number]; active: boolean; mini?: boolean }) {
  return (
    <a
      href={`#${v.id}`}
      title={mini ? v.label : undefined}
      aria-current={active ? "page" : undefined}
      className={`relative flex shrink-0 items-center gap-2.5 rounded-lg py-2 text-[13px] transition-colors duration-200 ${mini ? "justify-center px-0" : "px-2.5"} ${
        active ? "bg-white/[0.07] text-ink" : "text-ink-2 hover:bg-white/[0.04] hover:text-ink"
      }`}
    >
      {active && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-ug" />}
      <v.Icon size={17} weight={active ? "fill" : "regular"} className={active ? "text-ug" : ""} />
      {!mini && v.label}
    </a>
  );
}

const KEY = "fif.sidebar";
function readCollapsed() {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

// Evidence is one page per pillar; the sidebar links straight to each.
const TABS = ["materials", "smoke", "suppression"];
// tool pages take their own inputs, so the global habitat picker is hidden there
const TOOLS: View[] = ["risk", "predict", "fans", "lessons"];

export function Shell({ view, anchor, h, setH, onAsk, children }: { view: View; anchor: string; h: Habitat; setH: (h: Habitat) => void; onAsk: () => void; children: ReactNode }) {
  const tab = TABS.includes(anchor) ? anchor : "materials";
  const v = (id: View) => {
    const x = VIEWS.find((y) => y.id === id)!;
    return { id, label: x.label, Icon: x.Icon, href: `#${id}`, active: view === id };
  };
  const groups: BranchGroup[] = [
    { id: "act", label: "Check a fire", items: [v("risk"), v("predict"), v("fans")] },
    { id: "explore", label: "Explore the data", items: [v("overview"), v("atmosphere"), v("ranking"), v("explore")] },
    {
      id: "protect",
      label: "What protects the crew",
      items: [
        { id: "materials", label: "Prevention", Icon: ShieldCheck, href: "#materials", active: view === "evidence" && tab === "materials" },
        { id: "smoke", label: "Detection", Icon: Bell, href: "#smoke", active: view === "evidence" && tab === "smoke" },
        { id: "suppression", label: "Suppression", Icon: FireExtinguisher, href: "#suppression", active: view === "evidence" && tab === "suppression" },
      ],
    },
    { id: "plan", label: "Plan ahead", items: [{ ...v("gaps"), label: "Gaps & next tests" }, v("lessons")] },
  ];
  const current = VIEWS.find((v) => v.id === view)!;
  const [mini, setMini] = useState(readCollapsed);
  const toggle = () =>
    setMini((m) => {
      try {
        localStorage.setItem(KEY, m ? "0" : "1");
      } catch {}
      return !m;
    });

  // "[" toggles the sidebar, like most dashboard tools.
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.key === "[" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) toggle();
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, []);

  return (
    <div className="min-h-[100dvh]">
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-white/[0.06] bg-[#090c13] py-4 transition-[width] duration-300 ease-spring md:flex ${mini ? "w-[60px] px-2" : "w-56 px-3"}`}
      >
        <div className={`flex items-center ${mini ? "flex-col gap-3" : "gap-2 px-1"}`}>
          <a href="#overview" className="flex min-w-0 items-center gap-2.5" title="Flame in Freefall">
            <LogoMark size={26} className="shrink-0" />
            {!mini && (
              <span className="min-w-0">
                <span className="block truncate text-[13.5px] font-semibold leading-tight tracking-tight">Flame in Freefall</span>
                <span className="block truncate text-[12px] leading-tight text-muted">Fire-safety data explorer</span>
              </span>
            )}
          </a>
          <button
            onClick={toggle}
            title={mini ? "Expand sidebar  [" : "Collapse sidebar  ["}
            aria-label={mini ? "Expand sidebar" : "Collapse sidebar"}
            className={`grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted transition-colors hover:bg-white/[0.06] hover:text-ink ${mini ? "" : "ml-auto"}`}
          >
            {mini ? <SidebarSimple size={16} /> : <CaretDoubleLeft size={14} />}
          </button>
        </div>
        {mini ? (
          <nav className="mt-6 grid min-h-0 flex-1 content-start gap-0.5 overflow-y-auto" aria-label="Views">
            {VIEWS.map((v) => (
              <NavItem key={v.id} v={v} active={v.id === view} mini />
            ))}
          </nav>
        ) : (
          <div className="-mx-1 mt-1 min-h-0 flex-1 overflow-y-auto px-1 [scrollbar-width:thin]">
            <BranchedNav groups={groups} />
          </div>
        )}
        {!mini && (
          <div className="mt-auto shrink-0 space-y-1 border-t border-white/[0.06] px-2.5 pt-3 text-[12px] leading-relaxed text-muted">
            <div>
              <span className="num text-ink-2">{TOTALS.investigations}</span> investigations · <span className="num text-ink-2">{TOTALS.tests.toLocaleString()}</span> runs
            </div>
            <div>{DATA.source}</div>
            <a href="https://www.spaceappschallenge.org/2026/challenges/flame-in-freefall/" target="_blank" rel="noreferrer" className="block pt-2" title="NASA Space Apps Challenge 2026: Flame in Freefall">
              <img src="/spaceapps-logo.png" alt="NASA Space Apps Challenge" width={128} height={50} className="h-auto w-[128px] opacity-90 transition-opacity hover:opacity-100" />
            </a>
          </div>
        )}
      </aside>

      <div className={`transition-[padding] duration-300 ease-spring ${mini ? "md:pl-[60px]" : "md:pl-56"}`}>
        <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-[rgba(8,11,17,0.85)] backdrop-blur-xl">
          <div className="flex items-center gap-3 px-4 py-2.5 md:px-6">
            <LogoMark size={22} className="shrink-0 md:hidden" />
            <div className="min-w-0">
              <h1 className="truncate text-[16px] font-semibold leading-tight tracking-tight">{current.title}</h1>
              <p className="hidden truncate text-[12px] leading-tight text-muted xl:block">{current.sub}</p>
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-2">
              {!TOOLS.includes(view) && <span className="hidden text-[12px] text-muted xl:inline">Habitat</span>}
              {!TOOLS.includes(view) && (
                <div className="hidden sm:block">
                  <HabitatPicker h={h} setH={setH} compact />
                </div>
              )}
              <button
                onClick={onAsk}
                className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-ink px-3.5 text-[13px] font-medium text-bg shadow-[0_6px_20px_-8px_rgba(255,255,255,0.45)] transition-transform duration-300 ease-spring hover:-translate-y-px active:scale-[0.97]"
              >
                <ChatCircleText size={14} /> Ask<span className="hidden sm:inline"> the data</span>
              </button>
              <ShareLink />
              <Glossary />
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:hidden" aria-label="Views">
            {VIEWS.map((v) => (
              <NavItem key={v.id} v={v} active={v.id === view} />
            ))}
          </nav>
        </header>
        <main key={view} className="px-4 py-5 md:px-6">
          {/* small screens have no sidebar: show the Space Apps logo at the top of the page */}
          <a href="https://www.spaceappschallenge.org/2026/challenges/flame-in-freefall/" target="_blank" rel="noreferrer" className="mb-4 block md:hidden" title="NASA Space Apps Challenge 2026: Flame in Freefall">
            <img src="/spaceapps-logo.png" alt="NASA Space Apps Challenge" width={104} height={41} className="h-auto w-[104px]" />
          </a>
          {/* small screens: habitat picker scrolls with the page instead of eating sticky header height */}
          <div className={`mb-4 sm:hidden ${TOOLS.includes(view) ? "hidden" : ""}`}>
            <div className="mb-1.5 text-[12px] font-medium text-ink-2">Habitat</div>
            <HabitatPicker h={h} setH={setH} full />
          </div>
          {children}
          <footer className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/[0.06] pt-5 text-[12px] text-muted">
            <a href="https://www.spaceappschallenge.org/2026/challenges/flame-in-freefall/" target="_blank" rel="noreferrer" title="NASA Space Apps Challenge 2026">
              <img src="/spaceapps-logo.png" alt="NASA Space Apps Challenge" width={110} height={43} className="h-auto w-[110px]" />
            </a>
            <span>Built for the NASA Space Apps Challenge 2026 · Flame in Freefall · Data: NASA Physical Sciences Informatics (CC0)</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
