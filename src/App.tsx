import { useCallback, useEffect, useState } from "react";
import { HABITATS } from "./data/ai";
import { DEFAULT_WEIGHTS, decodeWeights, encodeWeights } from "./lib/data";
import { Atmosphere } from "./sections/Atmosphere";
import { Ranking } from "./sections/Ranking";
import { Explore } from "./sections/Explore";
import { Evidence } from "./sections/Evidence";
import { Gaps } from "./sections/Gaps";
import { AskSI, Drawer } from "./sections/Panels";
import { Shell, VIEWS, type View } from "./sections/Shell";
import { Overview } from "./sections/Overview";
import { Risk } from "./sections/Risk";
import { Predict } from "./sections/Predict";
import { Fans } from "./sections/Fans";
import { Lessons } from "./sections/Lessons";

// In-page anchors (from finding cards) that live inside another view.
const ANCHOR_VIEW: Record<string, View> = { findings: "overview", materials: "evidence", smoke: "evidence", suppression: "evidence" };

// URL shape: #<view or anchor>?h=<habitat>&w=<weights>&open=<PSI id>, so any view can be shared exactly.
function parse(nav = 0) {
  const [path, query = ""] = location.hash.slice(1).split("?");
  const q = new URLSearchParams(query);
  const view = VIEWS.some((v) => v.id === path) ? (path as View) : (ANCHOR_VIEW[path] ?? "risk");
  return { view, anchor: path, h: q.get("h"), w: q.get("w"), open: q.get("open"), nav };
}

export default function App() {
  const [route, setRoute] = useState(() => parse());
  const [habitat, setHabitat] = useState(() => HABITATS.find((x) => x.id === route.h) ?? HABITATS[2]);
  const [w, setW] = useState(() => decodeWeights(route.w) ?? DEFAULT_WEIGHTS);
  const [open, setOpen] = useState<string | null>(route.open);
  const [ask, setAsk] = useState(false);
  const closeDrawer = useCallback(() => setOpen(null), []);
  const closeAsk = useCallback(() => setAsk(false), []);
  const show = (id: string) => {
    setAsk(false);
    setOpen(id);
  };
  // tab switches inside a view update the URL but should not scroll
  const setAnchor = (anchor: string) => setRoute((r) => ({ ...r, anchor }));

  useEffect(() => {
    const on = () => {
      const r = parse();
      setRoute((prev) => ({ ...r, nav: prev.nav + 1 }));
      const h = HABITATS.find((x) => x.id === r.h);
      if (h) setHabitat(h);
      const nw = decodeWeights(r.w);
      if (nw) setW(nw);
      setOpen(r.open);
    };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);

  useEffect(() => {
    const el = route.anchor && route.anchor !== route.view && route.view !== "evidence" ? document.getElementById(route.anchor) : null;
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    else window.scrollTo({ top: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.view, route.nav]);

  // keep habitat, weights and open investigation in the URL without adding history entries
  useEffect(() => {
    const q = new URLSearchParams({ h: habitat.id });
    const enc = encodeWeights(w);
    if (enc !== encodeWeights(DEFAULT_WEIGHTS)) q.set("w", enc);
    if (open) q.set("open", open);
    history.replaceState(null, "", `#${route.anchor || route.view}?${q}`);
  }, [habitat, w, open, route.anchor, route.view]);

  const { view } = route;
  return (
    <>
      <Shell view={view} anchor={route.anchor} h={habitat} setH={setHabitat} onAsk={() => setAsk(true)}>
        {view === "risk" && <Risk h={habitat} setH={setHabitat} onOpen={show} />}
        {view === "overview" && <Overview h={habitat} w={w} onOpen={show} />}
        {view === "atmosphere" && <Atmosphere h={habitat} setH={setHabitat} onOpen={show} />}
        {view === "ranking" && <Ranking h={habitat} w={w} setW={setW} onOpen={show} />}
        {view === "explore" && <Explore h={habitat} w={w} onOpen={show} />}
        {view === "evidence" && <Evidence h={habitat} anchor={route.anchor} setAnchor={setAnchor} />}
        {view === "gaps" && <Gaps />}
        {view === "predict" && <Predict />}
        {view === "fans" && <Fans />}
        {view === "lessons" && <Lessons />}
      </Shell>
      <Drawer id={open} h={habitat} w={w} onClose={closeDrawer} onOpen={show} />
      <AskSI open={ask} h={habitat} onClose={closeAsk} onOpen={show} />
    </>
  );
}
