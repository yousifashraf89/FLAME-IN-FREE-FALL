import { useState } from "react";
import { CaretDown, type Icon } from "@phosphor-icons/react";

// Sidebar tree: a faint trunk, foldable sections, and a rounded branch to each item.
// The path from a section down to the selected item is traced in the accent colour.
export type BranchItem = { id: string; label: string; Icon: Icon; href?: string; onClick?: () => void; active?: boolean };
export type BranchGroup = { id: string; label: string; items: BranchItem[] };

const LINE = "rgba(255,255,255,0.10)";
const LIT = "var(--color-ug)";

export function BranchedNav({ groups }: { groups: BranchGroup[] }) {
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  return (
    <nav aria-label="Views" className="relative mt-5">
      <span className="absolute inset-y-1 left-[3px] w-px" style={{ background: LINE }} aria-hidden />
      {groups.map((g) => {
        const hit = g.items.findIndex((i) => i.active);
        const open = !closed[g.id];
        return (
          <div key={g.id} className="relative pb-1.5">
            {hit >= 0 && <span className="absolute left-[2px] top-1.5 h-5 w-[3px] rounded-full" style={{ background: LIT }} aria-hidden />}
            <button
              onClick={() => setClosed((c) => ({ ...c, [g.id]: open }))}
              aria-expanded={open}
              className={`flex w-full items-center justify-between rounded-md py-1.5 pl-4 pr-1.5 text-left text-[12.5px] font-semibold transition-colors hover:text-ink ${hit >= 0 ? "text-ink" : "text-ink-2"}`}
            >
              {g.label}
              <CaretDown size={11} className={`text-muted transition-transform duration-300 ease-spring ${open ? "" : "-rotate-90"}`} />
            </button>
            <div className={`grid transition-[grid-template-rows] duration-300 ease-spring ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
              <ul className="overflow-hidden" inert={!open}>
                {g.items.map((it, k) => {
                  const last = k === g.items.length - 1;
                  const traced = hit >= 0 && k < hit; // segments above the selected item
                  const Tag = it.href ? "a" : "button";
                  return (
                    <li key={it.id} className="relative">
                      {/* sub-trunk running past this item to the next one */}
                      {!last && <span className="absolute bottom-0 left-[18px] top-0 w-px transition-colors duration-300" style={{ background: traced ? LIT : LINE, transitionDelay: `${k * 40}ms` }} aria-hidden />}
                      {/* rounded elbow into the item */}
                      <span
                        className="absolute left-[18px] top-0 h-1/2 w-2.5 rounded-bl-[7px] border-b border-l transition-colors duration-300"
                        style={{ borderColor: it.active ? LIT : LINE, borderWidth: it.active ? "0 0 1.5px 1.5px" : undefined, transitionDelay: `${k * 40}ms` }}
                        aria-hidden
                      />
                      <Tag
                        {...(it.href ? { href: it.href } : { type: "button" as const })}
                        onClick={it.onClick}
                        aria-current={it.active ? "page" : undefined}
                        className={`relative ml-[32px] flex w-[calc(100%-32px)] items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors duration-200 ${
                          it.active ? "bg-white/[0.06] text-ink" : "text-ink-2 hover:bg-white/[0.04] hover:text-ink"
                        }`}
                      >
                        <it.Icon size={15} weight={it.active ? "fill" : "regular"} className={it.active ? "text-ug" : "text-muted"} />
                        {it.label}
                      </Tag>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        );
      })}
    </nav>
  );
}
