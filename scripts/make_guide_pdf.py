"""Build docs/Flame-in-Freefall-Dashboard-Guide.pdf: a short study guide to what the dashboard shows and why."""
import pathlib

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle, KeepTogether

OUT = pathlib.Path(__file__).resolve().parent.parent / "docs" / "Flame-in-Freefall-Dashboard-Guide.pdf"
INK, MUTED, BLUE, ORANGE, RULE = colors.HexColor("#111827"), colors.HexColor("#5b6472"), colors.HexColor("#1f5fbf"), colors.HexColor("#c2410c"), colors.HexColor("#d9dde3")

H1 = ParagraphStyle("h1", fontName="Helvetica-Bold", fontSize=20, leading=24, textColor=INK, spaceAfter=4)
SUB = ParagraphStyle("sub", fontName="Helvetica", fontSize=9.5, leading=13, textColor=MUTED, spaceAfter=10)
H2 = ParagraphStyle("h2", fontName="Helvetica-Bold", fontSize=12.5, leading=16, textColor=INK, spaceBefore=10, spaceAfter=4)
H3 = ParagraphStyle("h3", fontName="Helvetica-Bold", fontSize=10.5, leading=13, textColor=BLUE, spaceBefore=7, spaceAfter=2)
B = ParagraphStyle("b", fontName="Helvetica", fontSize=9.3, leading=12.8, textColor=INK, spaceAfter=3)
SM = ParagraphStyle("sm", parent=B, fontSize=8.6, leading=11.5, textColor=MUTED)
CELL = ParagraphStyle("cell", parent=B, fontSize=8.8, leading=11.6, spaceAfter=0)
CELLB = ParagraphStyle("cellb", parent=CELL, fontName="Helvetica-Bold")

O2 = "O<sub>2</sub>"
CO2 = "CO<sub>2</sub>"


def table(rows, widths, head=True):
    t = Table([[Paragraph(c, CELLB if (head and r == 0) or c_i == 0 else CELL) for c_i, c in enumerate(row)] for r, row in enumerate(rows)], colWidths=widths)
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LINEBELOW", (0, 0), (-1, -1), 0.5, RULE),
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f3f5f8") if head else colors.white),
        ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 5), ("RIGHTPADDING", (0, 0), (-1, -1), 5),
    ]))
    return t


def section(title, see, read, why):
    return KeepTogether([
        Paragraph(title, H3),
        Paragraph(f"<b>What you see.</b> {see}", B),
        Paragraph(f"<b>How to read it.</b> {read}", B),
        Paragraph(f"<b>Why it is useful.</b> {why}", B),
    ])


s = []
s.append(Paragraph("Flame in Freefall: dashboard guide", H1))
s.append(Paragraph("NASA Space Apps 2026 · what each part of the dashboard shows, and why it answers the challenge. "
                   "Repo: github.com/yousifashraf89/FLAME-IN-FREE-FALL", SUB))

s.append(Paragraph("1. What the challenge asks, and where we answer it", H2))
s.append(table([
    ["Challenge asks for", "Where in the dashboard"],
    ["Summarize, rank and interpret PSI combustion investigations with SI", "Findings, SI ranking, SI summary on every investigation, Ask the data chat"],
    ["Find the investigations most relevant to crew habitats (spacecraft, station, Moon base, rover)", "Oxygen map + Ranking (both react to the habitat you pick)"],
    ["Extract data for predictive flammability modeling", "Fire risk check (a model built on 274 FLEX fires); evidence charts from PSI tables; raw data link per investigation"],
    ["Show objectives, fuels, sample shape/size, " + O2 + ", airflow, variables, sensors", "Compare: up to 3 investigations side by side"],
    ["Highlight research for next-gen fire safety equipment; Earth benefits", "What protects the crew, Gaps and next experiments, Back on Earth, hospital oxygen bed in the risk check"],
], [78 * mm, 96 * mm]))

s.append(Paragraph("2. The data behind it", H2))
s.append(Paragraph(
    "All 24 investigations in NASA's Physical Sciences Informatics (PSI) Combustion Science area, pulled from the PSI API (CC0 licence), "
    "plus their 22 experimental tables. Together that is <b>2,947 logged test runs</b>, <b>13.5 TB</b> of archived flight data and <b>352 publications</b>. "
    "19 investigations flew on the ISS or in Cygnus cargo vehicles; 5 are ground modeling studies. A script (scripts/build_data.py) normalizes the tables "
    "into one dataset, for example 1,172 test points with a reported " + O2 + " level and pressure.", B))
s.append(Paragraph(
    "<b>The SI layer</b> (summaries, takeaways, three of the five scores, the six findings) was written by an AI model from the PSI text and tables. "
    "Every finding cites its source investigations. The Ask the data chat uses the same knowledge base, live via an AI model when an API key is set and by keyword retrieval otherwise.", B))

s.append(Paragraph("3. Section by section", H2))
s.append(Paragraph("Pick a habitat at the top (ISS, spacewalk-prep cabin, Moon base, Mars base). Every view, rank and chart follows it.", B))
s.append(Paragraph("The sidebar groups pages by what you can do: <b>Check a fire</b> (three tools that take your inputs and give an answer), <b>Explore the data</b>, <b>What protects the crew</b> and <b>Plan ahead</b>.", B))
s.append(section("Fire risk check (the start screen)",
    "A panel on the left: pick where you are (ISS, cargo vehicle, spacewalk-prep cabin, Moon base, lunar rover, Mars base, spacesuit, or Earth cases such as a hospital oxygen bed) or enter custom values, type what could burn (or tap cotton, acrylic, Nomex, wire insulation, ethanol, propane), confirm, and assess.",
    "The result card gives the risk level, whether the fire would go out by itself, how long it can burn and how close the case is to real NASA tests. Below: what to do, why (with the NASA tests used), an oxygen what-if slider and the same material in every place. "
    "Liquid fuel uses the 15 most similar of 274 FLEX fires (right 71 % of the time on tests it had not seen); solids and gas follow what the tests showed.",
    "It turns the archive into an answer for a place, and it says plainly when NASA has no data: no cabin material has been burned in space above 22.7 % " + O2 + "."))
s.append(section("Will it go out?",
    "A calculator for two kinds of flame: a liquid fuel drop (FLEX, 273 ISS burns) and a gas flame (ACME CFI-G, 132 ISS flames, with the fuel flow from the PSI table). Set fuel, oxygen, pressure, extinguishing gas or gas flow; the answer updates live.",
    "The big number is the chance the flame goes out by itself, with the typical burn time of similar tests. The chart shows the prediction across oxygen levels with every real test as a dot; the list shows the closest real tests. "
    "Accuracy on unseen tests: 79 % for drops and 89 % for gas flames, against 68 % and 77 % for always guessing the common outcome.",
    "It also shows the hidden cool flame (PSI-117): drops kept burning down to about 0.4 mm after the visible flame went out at about 3.6 mm."))
s.append(section("Turn off the fans?",
    "Every test from BASS (PSI-26, 106 ISS burns) where crews lit a solid and then slowed or stopped the airflow, grouped by material, plus the BASS-II runs (PSI-25) where the airflow was turned down until the flame went out.",
    "Pick a material: the card counts how often the flame went out when the air stopped (10 of 106 overall) against how often it kept burning (48 of 106). The bars show every outcome per material.",
    "Stopping the fans can slow a fire but is not reliable, and it does nothing for a fuel-fed flame: ACME BRE flames kept burning with no airflow at 21-40 % " + O2 + "."))
s.append(section("Overview",
    "The top finding for the chosen habitat (headline number, severity, recommended action, sources), the habitat's test coverage with its closest flight investigations, "
    "the five most relevant investigations, how many investigations cover each fire-safety pillar, the other findings, and the archive totals.",
    "Start with the big number and the action under it. Click any investigation to open its panel, or 'See the chart' to jump to the evidence.",
    "A judge or engineer gets the answer for their habitat in 30 seconds, and every claim links back to a PSI record."))
s.append(section("Oxygen map",
    "Every flight test with a reported " + O2 + " level, placed by " + O2 + " concentration (x) and pressure (y), coloured by fuel type. "
    "Rings mark the three habitats; the dashed line is constant breathing " + O2 + ".",
    "Habitats move down and right along the dashed line: same " + O2 + " for the lungs, higher concentration, so materials burn more easily. "
    "The side panel counts tests near the chosen habitat and lists the closest investigations.",
    "It exposes the biggest gap: <b>no real cabin material has been burned in microgravity above 22.7 % " + O2 + "</b>. "
    "Only 44 of 909 ambient test points sit near Moon-base conditions, all gas burners or droplets."))
s.append(section("Ranking",
    "Investigations scored 0-100 from five criteria: fire-safety relevance, habitat match, material realism, model-ready data, data depth.",
    "Habitat match and data depth are computed; the other three are AI-written scores (tagged AI) with a written rationale. "
    "Sliders or role presets re-weight the score live, and the weights carry over to the Overview, Compare and investigation panels.",
    "Different users need different rankings. For a Moon base, ACME BRE ranks first: the only flight test run in exploration atmospheres."))
s.append(section("Compare",
    "Search and filter all 24 investigations, pick up to three, and get a radar of the five scores plus a side-by-side table.",
    "Rows cover objective, fuel, sample shape, " + O2 + ", pressure, airflow, diluent, sensors, hardware, run count and archive size; matching rows are marked 'same'.",
    "This is the comparison the brief asks for: what varied, what stayed fixed, which sensors were used."))
s.append(section("What protects the crew: prevention, detection, suppression",
    "<b>Prevention:</b> Saffire-II microgravity vs 1-g burn lengths, and BASS-II solid tests against habitat " + O2 + " targets. "
    "<b>Detection:</b> SAME-R smoke particle growth by material. "
    "<b>Suppression:</b> all 274 FLEX droplet burns by " + O2 + " and added " + CO2 + " or helium, with the chosen habitat's " + O2 + " marked.",
    "No Saffire-II sample burned longer in microgravity than on Earth. Kapton and Teflon smoke particles grew about 44 % while aging, Pyrell foam about 23 %. "
    "FLEX burns that ran to completion sat at higher " + O2 + " (median 21 % vs 18 %).",
    "Concrete numbers for material qualification, detector calibration and extinguisher sizing."))
s.append(section("Gaps and next experiments",
    "A gravity axis drawn to scale (0 g, Moon 0.16 g, Mars 0.38 g, 1 g) showing where PSI has data, four NASA spinoffs, and four recommended next experiments.",
    "Green means data exists; red means none yet (LUCI and FM2 are planned).",
    "Turns the limits of the data into a research agenda, and covers the Earth-benefits part of the brief."))
s.append(section("Lessons from past fires",
    "Apollo 1 (1967), Apollo 13 (1970), the Mir fire (1997) and the Saffire experiments, each with what happened, the lesson, and what the PSI data says today.",
    "Each card links to the page with the matching evidence: the oxygen map, smoke detection, suppression or prevention.",
    "It connects the data to why it matters: rich oxygen, wire insulation and smoke caused real accidents, and exploration habitats will raise oxygen again."))
s.append(section("Investigation panel, Ask the data, Share view",
    "Any investigation opens a panel with its SI summary, rank, scores, test conditions, PSI objective and a raw-data link. "
    "Ask the data answers from the same knowledge base and cites investigations. Share view copies a link with the habitat, weights, tab and open investigation.",
    "Without a live AI key the chat falls back to keyword matching and says so; it answers 'no match' rather than guessing.",
    "A researcher goes from a question to the right dataset in one step, and any view can be sent to a teammate exactly as seen."))

s.append(Paragraph("4. Numbers worth remembering", H2))
s.append(table([
    ["Number", "Meaning"],
    ["0", "solid-material microgravity tests above 22.7 % " + O2 + " (Moon base needs 30-34 %)"],
    ["44 / 909", "ambient test points near Moon-base conditions, none of them solids"],
    ["40 %", "highest " + O2 + " at which ACME BRE kept fuel-fed flames burning in still air"],
    ["12 %", O2 + " at which FLEX methanol droplets still burned for up to 11 s"],
    ["44 % vs 23 %", "smoke particle growth while aging, Kapton vs Pyrell foam (SAME-R)"],
    ["0", "partial-gravity (Moon or Mars g) combustion datasets in PSI; these fires are not simply 'between' space and Earth"],
], [30 * mm, 144 * mm]))

s.append(Paragraph("5. Caveats to state if asked", H2))
s.append(Paragraph(
    "Pressure is not logged per test for BASS-II and Saffire (cabin pressure is shown) or for BRE's reduced-pressure runs (BRE's stated target atmospheres are used); the chart tooltip flags these. "
    "FLEX outcome shares come from a designed test matrix (helium runs also used less oxygen), so they are tendencies, not a ranking of suppressants. "
    "Three ranking scores are SI judgments; their rationale is shown and users can re-weight or zero them. "
    "Rocket and propellant fires are outside PSI's scope.", SM))

OUT.parent.mkdir(exist_ok=True)
SimpleDocTemplate(str(OUT), pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm, topMargin=16 * mm, bottomMargin=16 * mm,
                  title="Flame in Freefall: dashboard guide", author="Flame in Freefall team").build(s)
print("wrote", OUT)
