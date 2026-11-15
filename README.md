# Flame in Freefall: Microgravity Fire Safety Intelligence

Team project for NASA Space Apps Challenge 2026 (Sakhir, Bahrain). Built by the team: dashboard, trained models, extra PSI datasets and chat grounding. The Space Apps logo in `public/` is the official file from spaceappschallenge.org, unmodified.

NASA Space Apps Challenge 2026, **Flame in Freefall** challenge.

This is an interactive, SI-powered dashboard. It summarizes, ranks and interprets the 24 combustion-science investigations in NASA's [Physical Sciences Informatics (PSI)](https://psi.nasa.gov/physci/repo/search?q=combustion) database, all aimed at fire safety for spacecraft, Moon bases and pressurized rovers.

## What's inside

| Section | What it answers |
|---|---|
| **Findings** | Six SI-interpreted, source-cited takeaways, each with a recommended action |
| **Habitat lens** | Every test point plotted by O₂ concentration and pressure against ISS, EVA-prep and Moon-base atmospheres. Shows what has and hasn't been tested |
| **SI ranking** | 24 investigations ranked by 5 criteria (2 computed, 3 SI-judged) with live weight sliders and role presets |
| **Compare** | Filter or search all investigations, then compare up to 3 side by side (objectives, fuels, sample geometry, O₂, pressure, flow, sensors) |
| **Evidence** | Charts built straight from PSI tables: Saffire-II µg vs 1-g burns, BASS-II O₂ coverage, SAME-R smoke growth, FLEX suppression map |
| **Gaps** | Gravity coverage (no Moon or Mars g data) and recommended next experiments |
| **Ask SI** | Chat grounded in the knowledge base. Live AI answers when an API key is set, offline retrieval otherwise |

## Trained models and extra grounding

- `src/data/models.json`: prediction grids exported from trained scikit-learn models (gradient boosting with likely ranges), checked with 5-fold cross-validation: FLEX burning rate R² 0.65 and flame lifetime R² 0.59, SAME-R smoke particle growth R² 0.89. Used on the "Will it go out?" page for the burning-rate/lifetime card and the Smoke tab.
- `src/data/kb.ts`: curated lessons plus 86 passages from the NASA Researcher's Guide to ISS Combustion Science (2015). The Ask chat (`api/chat.ts`) adds the passages that best match each question; they are not shipped to the browser.

## Data pipeline

```bash
python scripts/fetch_psi.py   # PSI API -> data/raw (investigation records + 22 experimental tables)
python scripts/build_data.py  # normalize -> src/data/psi.json + src/data/meta.ts
```

All data is CC0 from NASA PSI. The SI layer (summaries, scores, findings) is in `src/data/ai.ts`. It was written by an AI model from the PSI text and tables, and every finding lists its source investigations.

## Run locally

```bash
npm install
npm run dev
```

## Deploy (Vercel)

Vite static build plus one serverless function (`api/chat.ts`). To turn on live AI chat, set `GROQ_API_KEY` (free tier; optional `GROQ_MODEL`, default `llama-3.3-70b-versatile`) or `ANTHROPIC_API_KEY` in the Vercel project environment variables.
