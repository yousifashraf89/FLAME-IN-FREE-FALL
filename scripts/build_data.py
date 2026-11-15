"""Normalize raw PSI combustion data into src/data/psi.json for the dashboard.

Every number in the output comes from a PSI experimental table or investigation record.
Where a table does not report a value we leave it out, except the flagged cases in
`assumed` notes (e.g. ISS cabin pressure for glovebox tests).
Run: python scripts/build_data.py
"""
import csv
import io
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
OUT = ROOT / "src" / "data" / "psi.json"
ATM_KPA = 101.325
MMHG_KPA = 0.133322
BAR_KPA = 100.0


def table(name: str) -> list[dict]:
    path = next((RAW / "tables").glob(f"{name}*.csv"))
    text = path.read_bytes().decode("utf-8-sig", "ignore")
    rows = list(csv.reader(io.StringIO(text)))
    head = [re.sub(r"\s+", " ", h).strip() for h in rows[0]]
    return [dict(zip(head, (c.strip() for c in r))) for r in rows[1:] if any(c.strip() for c in r)]


def num(s) -> float | None:
    m = re.search(r"-?\d+(?:\.\d+)?", str(s or "").replace(",", ""))
    return float(m.group()) if m else None


def r(x, n=3):
    return None if x is None else round(x, n)


def investigations() -> list[dict]:
    out = []
    for f in sorted((RAW / "investigations").glob("*.json"), key=lambda p: int(p.stem.split("-")[1])):
        d = json.loads(f.read_text(encoding="utf8"))
        clean = lambda s: re.sub(r"\s+", " ", s or "").strip()
        out.append(
            {
                "id": d["accession"],
                "acronym": d["investigationAcronym"].strip() or None,
                "title": clean(d["title"]),
                "type": "flight" if "Microgravity" in d["projectType"] else "ground",
                "subArea": clean(d["subResearchArea"]),
                "hardware": clean(d["experimentHardware"]),
                "start": d["investigationStartDate"] or None,
                "end": d["investigationEndDate"] or None,
                "pi": d.get("pi", ""),
                "dataGB": round(float(d["totalFileSize"] or 0) / 1e9, 2),
                "pubs": len(d["publications"]),
                "related": [x.strip() for x in (d["related_glds"] or "").split(",") if x.strip()],
                "doi": d["doi"],
                "objective": clean(d["objective"]),
                "hypothesis": clean(d["hypothesis"]),
                "approach": clean(d["approach"]),
                "impacts": clean(d["researchImpacts"]),
                "tables": [t["file_name"] for t in d.get("experimentalTable") or []],
            }
        )
    return out


def flex():
    rows = []
    for t in table("PSI-69_"):
        o2, co2, he = num(t["O initial ambient composition; mole fraction"]), num(t["CO initial ambient composition; mole fraction"]), num(t["He initial ambient composition; mole fraction"])
        rows.append(
            {
                "fuel": t["Fuel"],
                "p": r(num(t["Ambient pressure; mmHg"]) * MMHG_KPA, 1) or None,  # one row logs 0 mmHg
                "o2": o2,
                "co2": co2 or 0,
                "he": he or 0,
                "d0": num(t["Droplet initial diameter; mm"]),
                "dExt": num(t["Visible flame extinction diameter; mm"]),
                "k": num(t["Burning rate; mm"]),  # mm^2/s burning-rate constant as reported
                "tb": num(t["Burn time; s"]),
                "end": t["Test end"],
            }
        )
    return rows


def cfig():
    rows = []
    for t in table("PSI-159_Experimental_table_CFI-G_Normal"):
        rows.append(
            {
                "kind": "normal",
                "fuel": t["Fuel"],
                "xo2": r(num(t["XO2 before test"]), 3),
                "p": r(num(t["approx p (bar)"]) * BAR_KPA, 1),
                "hot": t["Hot ignition"].lower().startswith("y"),
                "cool": t["Cool flame?"].lower().startswith("yes") or "cool flame" in t["Comments"].lower(),
                "burn": num(t["burn time (sec)"]),
                "end": {"SE": "self-extinguished", "FT": "flow terminated"}.get(t["Self-ext or flow term"], "no flame"),
            }
        )
    for t in table("PSI-159_Experimental_table_CFI-G_Inverse"):
        hot = t["Hot ignition"].lower()
        rows.append(
            {
                "kind": "inverse",
                "fuel": t["Fuel"],
                "xo2": num(t["XO2"]),
                "p": r(num(t["approx p (bar)"]) * BAR_KPA, 1),
                "hot": hot.startswith("y"),
                "cool": "cool" in t["Comments"].lower() or "cool" in t["Color"].lower(),
                "burn": num(t["burn time (sec)"]),
                "end": {"SE": "self-extinguished", "FT": "flow terminated"}.get(t["Self -ext or flow term"], "no flame"),
            }
        )
    return rows


def saffire():
    rows = []
    for t in table("PSI-98_"):
        rows.append({"mission": "Saffire-I", "sample": t["Sample Number"], "material": "SIBAL (cotton-fiberglass)", "thick": f'{t["Sample Thickness (cm)"]} cm', "flow": num(t["Air Flow (cm/s)"]), "dir": t["Flow Direction"], "o2": t["Percent O2"], "burnTime": num(t["Burn Time (s)"]), "size": f'{t["Sample Length (cm)"]} x {t["Sample Width (cm)"]} cm'})
    last = ""
    for t in table("PSI-99_"):
        if not t["Sample Number"].startswith("2-"):
            continue
        mat = t["Material"] or last
        last = mat
        rows.append(
            {
                "mission": "Saffire-II",
                "sample": t["Sample Number"],
                "material": mat.replace("Cotton-Fiberglass (SIBAL)", "SIBAL (cotton-fiberglass)"),
                "thick": t["Samle Thickness"].replace("037", "0.37"),
                "flow": num(t["Air Flow (cm/s)"]),
                "dir": t["Flow Direction"],
                "o2": t["Percent O2 (Note 1)"],
                "burnTime": num(t["Burn Time (s)"]),
                "ugBurn": t["?-g Burn Length"],
                "ugSpread": t["?-g Spread Length"],
                "gBurn": t["1-g Burn Length"],
                "gSpread": t["1-g Spread Rate"],
            }
        )
    for t in table("PSI-100_"):
        rows.append({"mission": "Saffire-III", "sample": t["Sample Number"], "material": "SIBAL (cotton-fiberglass)", "thick": t["Sample Thickness"], "flow": num(t["Air Flow"]), "dir": t["Direction"], "size": f'{t["Sample Length"]} x {t["Sample Width"]}'})
    return rows


def bass2():
    rows = []
    for t in table("PSI-25_"):
        o2i, o2f = num(t["Calibrated initial O2 % by vol"]), num(t["Calibrated final O2 % by vol"])
        mat = t["Fuel Sample Material"]
        low = mat.lower()
        family = "PMMA" if ("pmma" in low or "rod" in low or "acrylic" in low) else "SIBAL fabric" if "sibal" in low else "Other"
        rows.append({"test": t["Test #"], "pi": t["PI"], "material": mat, "family": family, "o2i": o2i, "o2f": o2f, "co2i": num(t["Initial CO2 % by vol"]), "co2f": num(t["Final CO2 % by vol"]), "cof": num(t["Final CO (ppm)"]), "air": t["Air display"]})
    return rows


def same():
    rows = []
    for t in table("PSI-101_"):
        rows.append({"material": t["Sample Type"], "desc": t["Description"], "v": num(t["Inlet velocity (cm/s)"]), "growth": num(t["Rt/R0"]), "aging": num(t["Net aging time (sec)"])})
    return rows


def spice():
    rows = []
    for t in table("PSI-107_"):
        fr, air = num(t["Fuel Rate (mg/s)"]), num(t["Air Rate (cm/s)"])
        if fr is None or air is None:
            continue
        rows.append({"fuel": re.sub(r"\s*%\s*", "% ", t["Fuel"]).strip(), "nozzle": num(t["Nozzle (mm)"]), "fuelRate": fr, "air": air})
    return rows


def atmosphere(flex_rows, cfig_rows, bass_rows):
    """Every flight test point with a reported O2 level, on (O2 %, pressure kPa)."""
    pts = []
    for f in flex_rows:
        if f["o2"] is not None and f["p"]:
            pts.append({"inv": "PSI-69", "o2": round(f["o2"] * 100, 1), "p": f["p"], "mode": "ambient", "phase": "liquid", "note": f"{f['fuel']} droplet, ended by {f['end'].lower()}"})
    for t in table("PSI-39_"):
        pts.append({"inv": "PSI-39", "o2": num(t["Oxygen"]) * 100, "p": r(num(t["Pressure"]) * ATM_KPA, 1), "mode": "ambient", "phase": "liquid", "note": t["Fuel"] + " droplet"})
    for c in cfig_rows:
        if c["xo2"] and c["p"]:
            pts.append({"inv": "PSI-159", "o2": round(c["xo2"] * 100, 1), "p": c["p"], "mode": "ambient" if c["kind"] == "normal" else "oxidizer", "phase": "gas", "note": f"{c['fuel']} {c['kind']} flame"})
    for t in table("PSI-10_Experimental_table_Flame_Design_Normal"):
        o2, p = num(t["XO2 (init)"]), num(t["pmean (atm)"]) or num(t["pinit (atm)"])
        if o2 and p:
            pts.append({"inv": "PSI-10", "o2": round(o2 * 100, 1), "p": r(p * ATM_KPA, 1), "mode": "ambient", "phase": "gas", "note": f"{t['Fuel']} normal flame"})
    for t in table("PSI-10_Experimental_table_Flame_Design_Inverse"):
        o2, p = num(t["XO2"]), num(t["pmean (atm)"])
        if o2 and p and t["XO2"][0].isdigit():
            pts.append({"inv": "PSI-10", "o2": round(o2 * 100, 1), "p": r(p * ATM_KPA, 1), "mode": "oxidizer", "phase": "gas", "note": "C2H4 inverse flame"})
    for b in bass_rows:
        if b["o2i"]:
            pts.append({"inv": "PSI-25", "o2": b["o2i"], "p": ATM_KPA, "mode": "ambient", "phase": "solid", "note": b["material"], "assumedP": True})
    # BRE: objective lists the NASA atmospheres tested (14.7 psi/21%, 10.2 psi/26.5%, 8.2 psi/34%)
    bre_p = {21.0: ATM_KPA, 26.5: 70.3, 34.0: 56.5}
    for t in table("PSI-20_"):
        for o in re.split(r"[;,]", t["Oxygen Conc (percent)"]):
            v = num(o)
            if v in bre_p:
                pts.append({"inv": "PSI-20", "o2": v, "p": bre_p[v], "mode": "ambient", "phase": "gas", "note": f"{t['Fuel Bottle']} burner, {t['Burner Size (mm)']} mm", "assumedP": v != 21.0})
    for s in table("PSI-98_") + table("PSI-99_"):
        o = num(s.get("Percent O2") or s.get("Percent O2 (Note 1)"))
        if o and s.get("Material"):
            pts.append({"inv": "PSI-98" if "Percent O2" in s else "PSI-99", "o2": o, "p": ATM_KPA, "mode": "ambient", "phase": "solid", "note": s["Material"], "assumedP": True})
    for p in pts:
        p["o2"] = round(p["o2"], 1)
    return pts


def test_counts() -> dict:
    counts = {}
    for f in (RAW / "tables").glob("*.csv"):
        acc = f.name.split("_")[0]
        n = len(table(f.name.rsplit(".", 1)[0]))
        counts[acc] = counts.get(acc, 0) + n
    # tables that list sessions/days, not individual tests
    for acc, note_rows in {"PSI-20": "Flames Ignited", "PSI-21": "Flames ignited", "PSI-22": "Flames Ignited", "PSI-23": "Flames Ignited*"}.items():
        name = next((RAW / "tables").glob(f"{acc}_*.csv")).name.rsplit(".", 1)[0]
        counts[acc] = int(sum(num(t.get(note_rows)) or 0 for t in table(name)))
    counts["PSI-99"] = sum(1 for t in table("PSI-99_") if t["Sample Number"].startswith("2-"))  # rest are notes
    return counts


def main():
    inv = investigations()
    counts = test_counts()
    for i in inv:
        i["nTests"] = counts.get(i["id"], 0)
    fx, cf, b2 = flex(), cfig(), bass2()
    data = {
        "source": "NASA Physical Sciences Informatics (PSI) - psi.nasa.gov, Combustion Science (CC0)",
        "investigations": inv,
        "atmosphere": atmosphere(fx, cf, b2),
        "flex": fx,
        "cfig": cf,
        "saffire": saffire(),
        "bass2": b2,
        "same": same(),
        "spice": spice(),
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data, separators=(",", ":")), encoding="utf8")
    # compact metadata as a TS module so the serverless chat function can import it without JSON loaders
    meta = {i["id"]: {k: i[k] for k in ("title", "type", "hardware", "start", "end", "pi", "dataGB", "pubs", "nTests", "doi")} for i in inv}
    (OUT.parent / "meta.ts").write_text(
        "// generated by scripts/build_data.py\nexport const META: Record<string, {title: string; type: string; hardware: string; start: string | null; end: string | null; pi: string; dataGB: number; pubs: number; nTests: number; doi: string}> = "
        + json.dumps(meta, indent=1, ensure_ascii=False)
        + ";\n",
        encoding="utf8",
    )
    print(f"wrote {OUT.relative_to(ROOT)}: {OUT.stat().st_size // 1024} KB")
    for k, v in data.items():
        if isinstance(v, list):
            print(f"  {k}: {len(v)}")
    print("  tests per investigation:", {i["id"]: i["nTests"] for i in inv})


if __name__ == "__main__":
    main()
