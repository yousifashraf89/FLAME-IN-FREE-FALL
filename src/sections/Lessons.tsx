import { ArrowRight } from "@phosphor-icons/react";
import { Card } from "../components/ui";

// Well-documented spacecraft fires, each tied to what the PSI archive can (and can't) say about it today.
const FIRES = [
  {
    year: "1967",
    title: "Apollo 1",
    what: "During a ground test on the launch pad, the cabin held pure oxygen above sea-level pressure. A spark near wiring set the cabin's nylon and Velcro alight, and the fire spread in seconds. Three astronauts died.",
    lesson: "Rich oxygen turns ordinary materials into fast fuel. NASA changed the pad atmosphere, removed flammable materials and redesigned the hatch.",
    today: "Exploration habitats will again raise oxygen (Moon base 34 %). No cabin material has been burned in space above 22.7 %.",
    link: { href: "#atmosphere", label: "See the oxygen map" },
  },
  {
    year: "1970",
    title: "Apollo 13",
    what: "Damaged wiring inside an oxygen tank sparked; its Teflon insulation burned in the pure oxygen and the tank burst, crippling the spacecraft on the way to the Moon.",
    lesson: "Wire insulation is a fire source, and a fire inside a sealed system can be invisible until it fails.",
    today: "NASA has only heated Teflon and Kapton for smoke studies (SAME-R); it has never burned them in microgravity.",
    link: { href: "#smoke", label: "See smoke detection" },
  },
  {
    year: "1997",
    title: "Mir space station",
    what: "A canister that makes oxygen by burning a chemical caught fire. Thick smoke filled the station; the crew put on masks and used several extinguishers before it went out.",
    lesson: "Smoke, not flame, is often the first danger in a closed cabin. Detection and breathing protection matter as much as putting the fire out.",
    today: "BASS and BASS-II tested how airflow and extinguishing gas affect flames on the ISS.",
    link: { href: "#suppression", label: "See suppression" },
  },
  {
    year: "2016 on",
    title: "Saffire, on purpose",
    what: "NASA lit large fires inside empty Cygnus cargo ships after they left the ISS: the biggest fires ever burned in space, with real cabin fabrics and plastics.",
    lesson: "Cotton-fiberglass fabric burned its full length in microgravity, just as on Earth. Ordinary cabin fabric can carry a fire in space.",
    today: "These tests ran near normal air (about 21 % oxygen). Rich exploration atmospheres are still untested.",
    link: { href: "#materials", label: "See prevention" },
  },
];

export function Lessons() {
  return (
    <section className="max-w-[980px]">
      <p className="mb-5 max-w-[68ch] text-[13.5px] leading-relaxed text-ink-2">Four fires shaped how NASA thinks about fire in space. For each, what happened, what changed, and what the data in this dashboard says now.</p>
      <ol className="relative space-y-4 before:absolute before:bottom-4 before:left-[15px] before:top-4 before:w-px before:bg-white/[0.08] sm:before:left-[19px]">
        {FIRES.map((f, i) => (
          <li key={f.title} className="relative grid grid-cols-[32px_1fr] gap-3 sm:grid-cols-[40px_1fr] sm:gap-4">
            <span className="relative z-[1] mt-5 grid h-8 w-8 place-items-center rounded-full bg-[#0c111b] text-[11px] text-flame ring-1 ring-flame/40 sm:h-10 sm:w-10">{i + 1}</span>
            <Card inner="p-5" delay={i * 60}>
              <div className="flex flex-wrap items-baseline gap-x-3">
                <span className="num text-[12.5px] text-flame">{f.year}</span>
                <h2 className="text-[16px] font-semibold tracking-tight">{f.title}</h2>
              </div>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">{f.what}</p>
              <div className="mt-4 grid gap-4 border-t border-white/[0.06] pt-4 md:grid-cols-2">
                <div>
                  <div className="text-[12px] font-medium text-muted">The lesson</div>
                  <p className="mt-1 text-[13px] leading-relaxed text-ink">{f.lesson}</p>
                </div>
                <div>
                  <div className="text-[12px] font-medium text-muted">What the data says now</div>
                  <p className="mt-1 text-[13px] leading-relaxed text-ink">{f.today}</p>
                  <a href={f.link.href} className="mt-2 inline-flex items-center gap-1 text-[12.5px] text-ug hover:underline">
                    {f.link.label} <ArrowRight size={12} />
                  </a>
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ol>
    </section>
  );
}
