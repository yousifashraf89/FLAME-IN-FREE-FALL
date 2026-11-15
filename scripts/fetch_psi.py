"""Download combustion-science investigations + experimental tables from NASA PSI.

Source: https://psi.nasa.gov/physci/repo/search?q=combustion  (CC0 data)
Writes trimmed metadata to data/raw/investigations/*.json and CSVs to data/raw/tables/.
Run: python scripts/fetch_psi.py   (then python scripts/build_data.py)
"""
import json
import pathlib
import urllib.parse
import urllib.request

API = "https://psi.nasa.gov/geode-py/ws"
ROOT = pathlib.Path(__file__).resolve().parent.parent / "data" / "raw"
# file listings ('added'/'removed') are ~1 MB each and not needed by the dashboard
DROP = {"added", "removed", "modified", "contacts"}


def get(url: str) -> bytes:
    with urllib.request.urlopen(url, timeout=60) as r:
        return r.read()


def main() -> None:
    (ROOT / "investigations").mkdir(parents=True, exist_ok=True)
    (ROOT / "tables").mkdir(parents=True, exist_ok=True)
    hits = json.loads(get(f"{API}/repo/search?data_source=psi&data_type=investigation&size=500"))["hits"]["hits"]
    ids = sorted(
        (h["_source"]["Accession"] for h in hits if "ombust" in h["_source"].get("Research Area", "")),
        key=lambda a: int(a.split("-")[1]),
    )
    print(f"{len(ids)} combustion investigations")
    for acc in ids:
        d = json.loads(get(f"{API}/repo/investigations/{acc}"))
        contacts = d.get("contacts") or []
        d["pi"] = f"{contacts[0].get('firstName', '')} {contacts[0].get('lastName', '')}".strip() if contacts else ""
        trimmed = {k: v for k, v in d.items() if k not in DROP}
        (ROOT / "investigations" / f"{acc}.json").write_text(json.dumps(trimmed, indent=1), encoding="utf8")
        for t in d.get("experimentalTable") or []:
            q = urllib.parse.urlencode(
                {"file": t["file_name"], "version": d["version"], "redirect": "false"}, quote_via=urllib.parse.quote
            )
            signed = get(f"{API}/studies/{acc}/download?{q}").decode().strip().strip('"')
            (ROOT / "tables" / t["file_name"].replace(" ", "_")).write_bytes(get(signed))
        print(" ", acc, d.get("investigationAcronym"), len(d.get("experimentalTable") or []), "tables")


if __name__ == "__main__":
    main()
