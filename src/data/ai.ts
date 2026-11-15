// SI layer: AI-authored interpretation of the PSI combustion records.
// Every summary below was written from the investigation's own PSI objective,
// hypothesis, approach and impact text plus its experimental table.
// Scores are judgments on a 0-5 scale; the rationale is shown in the UI.

export type Phase = "solid" | "liquid" | "gas" | "aerosol";
export type Category = "Solid materials" | "Liquid fuels" | "Gaseous flames" | "Smoke & detection";

export interface InvAI {
  id: string;
  name: string; // short display name
  category: Category;
  phase: Phase;
  summary: string; // what it did, plain language
  takeaway: string; // why fire-safety engineers should care
  fuel: string;
  geometry: string;
  o2: string;
  pressure: string;
  flow: string;
  diluent: string;
  sensors: string;
  pillars: { prevention: number; detection: number; suppression: number };
  scores: { safety: number; realism: number; model: number };
  rationale: string;
  // nominal atmospheres for investigations whose table does not report O2/pressure per test
  atmo?: { o2: number; p: number }[];
  inherits?: string[]; // ground studies analysing flight data
}

const AIR = [{ o2: 21, p: 101.3 }];

export const AI: InvAI[] = [
  {
    id: "PSI-25", name: "BASS-II", category: "Solid materials", phase: "solid",
    summary: "129 ISS glovebox burns of PMMA rods/sheets, SIBAL fabric and other solids in a small wind tunnel, varying airflow (up to 40 cm/s) and oxygen (diluted below 21% with nitrogen) to find ignition, spread and extinction limits.",
    takeaway: "The core dataset for 'will this material burn in a spacecraft?' It ties microgravity flammability to NASA-STD-6001 Test 1, the 1-g screening test used to approve crew-cabin materials.",
    fuel: "PMMA rods & sheets, SIBAL cotton-fiberglass, other solids", geometry: "Flat sheets, cylinders/rods, thin films (1–3/8\")",
    o2: "13.6–22.2 % (N₂-diluted)", pressure: "ISS cabin (~101 kPa)", flow: "0–40 cm/s forced, opposed & concurrent", diluent: "N₂",
    sensors: "Video, radiometer, O₂/CO₂/CO gas analyzers",
    pillars: { prevention: 5, detection: 2, suppression: 3 }, scores: { safety: 5, realism: 5, model: 5 },
    rationale: "Real cabin materials, many runs, measured O₂/CO₂/CO, and a direct bridge to the materials-acceptance standard.",
  },
  {
    id: "PSI-26", name: "BASS", category: "Solid materials", phase: "solid",
    summary: "122 ISS glovebox tests burning PMMA spheres and sheets, SIBAL fabric, Nomex, Ultem and wax candles in a fan-driven flow, including 'wake' flames behind obstacles and suppression by a nitrogen jet.",
    takeaway: "Tested the hypothesis that ventilated materials burn as well or better in microgravity than on Earth, and checked whether an inert-gas jet can put the fire out. Both matter for choosing materials and extinguishers.",
    fuel: "PMMA, SIBAL, Nomex, Ultem, candle wax", geometry: "Spheres, flat sheets, cylinders, wake (behind obstacle)",
    o2: "Cabin air (~21 %)", pressure: "ISS cabin (~101 kPa)", flow: "Up to 40 cm/s, opposed & concurrent", diluent: "N₂ suppression jet",
    sensors: "Video, radiometer, thermocouples",
    pillars: { prevention: 5, detection: 1, suppression: 4 }, scores: { safety: 5, realism: 4, model: 4 },
    rationale: "Practical materials and geometries plus a direct suppression test, but the table logs only the sample, not the conditions of each run.",
    atmo: AIR,
  },
  {
    id: "PSI-98", name: "Saffire-I", category: "Solid materials", phase: "solid",
    summary: "The first large-scale spacecraft fire: a 94 × 40 cm SIBAL fabric sheet burned inside an uncrewed Cygnus cargo vehicle after it left the ISS, at 20 cm/s airflow.",
    takeaway: "Shows how fast a realistic-size fire grows in a closed vehicle, measuring O₂, CO₂, heat and cabin pressure rise. This is the closest data to an actual cabin fire.",
    fuel: "SIBAL (75 % cotton / 25 % fiberglass)", geometry: "Large sheet 94 × 40.6 cm",
    o2: "~21.5 %", pressure: "Cygnus cabin (~101 kPa)", flow: "20 cm/s, concurrent & opposed", diluent: "—",
    sensors: "2 cameras, thermocouples, radiometers, O₂/CO₂, pressure",
    pillars: { prevention: 5, detection: 3, suppression: 2 }, scores: { safety: 5, realism: 5, model: 4 },
    rationale: "Vehicle-scale fire. The test count is small but each run is uniquely valuable.",
  },
  {
    id: "PSI-99", name: "Saffire-II", category: "Solid materials", phase: "solid",
    summary: "Nine samples (silicone of several thicknesses, SIBAL, PMMA, PMMA with Nomex) burned in Cygnus at 20 cm/s, each paired with a normal-gravity reference burn.",
    takeaway: "The only PSI table that puts microgravity and 1-g burn lengths side by side for the same material. Thin silicone burned completely in 1 g but barely at all in microgravity, so the 1-g test can be conservative for some materials and not for others.",
    fuel: "Silicone, SIBAL, PMMA, Nomex", geometry: "29 × 5 cm strips, 0.27–10 mm thick",
    o2: "~21.5–22.1 %", pressure: "Cygnus cabin (~101 kPa)", flow: "20 cm/s", diluent: "—",
    sensors: "Cameras, thermocouples, radiometers, O₂/CO₂",
    pillars: { prevention: 5, detection: 2, suppression: 1 }, scores: { safety: 5, realism: 5, model: 4 },
    rationale: "Direct space-versus-Earth material comparison, which is exactly what materials engineers need.",
  },
  {
    id: "PSI-100", name: "Saffire-III", category: "Solid materials", phase: "solid",
    summary: "Repeat of the large SIBAL fabric burn at a higher airflow (30 cm/s), concurrent and opposed, inside Cygnus.",
    takeaway: "Adds the effect of ventilation speed on how fast a large fire spreads, which feeds directly into cabin airflow design and fire-response timing.",
    fuel: "SIBAL fabric", geometry: "Large sheet 94 × 40.6 cm, 0.33 cm",
    o2: "Cabin air (~21 %)", pressure: "Cygnus cabin (~101 kPa)", flow: "30 cm/s", diluent: "—",
    sensors: "2 cameras, thermocouples, radiometers, gas analyzers",
    pillars: { prevention: 5, detection: 3, suppression: 1 }, scores: { safety: 5, realism: 5, model: 3 },
    rationale: "Vehicle-scale, only 2 runs.",
    atmo: AIR,
  },
  {
    id: "PSI-69", name: "FLEX", category: "Liquid fuels", phase: "liquid",
    summary: "274 ISS droplet burns of methanol and heptane in mixtures of O₂ with N₂, CO₂ and helium, from 0.5 to 3 atm, to map flammability limits and how well gaseous suppressants work.",
    takeaway: "The richest suppression dataset in PSI. It shows the lowest oxygen level that still keeps a flame alive, for each pressure and added gas, which is how much CO₂ or helium it takes to make a fuel non-flammable in microgravity.",
    fuel: "Methanol, n-heptane", geometry: "Free & fiber-supported droplets, 1.5–5 mm",
    o2: "12–34 %", pressure: "~50–310 kPa", flow: "Quiescent", diluent: "CO₂, He, N₂",
    sensors: "Backlit droplet video, OH* & broadband flame imaging, radiometer",
    pillars: { prevention: 3, detection: 0, suppression: 5 }, scores: { safety: 5, realism: 2, model: 5 },
    rationale: "Many controlled runs on extinguishment. The fuels are lab droplets rather than cabin materials.",
  },
  {
    id: "PSI-68", name: "FLEX-2", category: "Liquid fuels", phase: "liquid",
    summary: "Extended FLEX to two-component fuel droplets and real-fuel surrogates, varying pressure (0.5–3 atm), O₂ (0.17–0.30) and slow convective flow.",
    takeaway: "Benchmark data for droplet-burning models used in fire-spread and suppression simulations. Shows how fuel mixtures change burning and extinction.",
    fuel: "Heptane, isooctane, decane, hexanol mixtures", geometry: "Droplets 1.5–5 mm",
    o2: "17–30 %", pressure: "50–300 kPa", flow: "0.1–5 cm/s", diluent: "N₂, He",
    sensors: "Droplet video, flame imaging, radiometer",
    pillars: { prevention: 2, detection: 0, suppression: 3 }, scores: { safety: 3, realism: 2, model: 5 },
    rationale: "Strong for modeling. Its table is a test-matrix summary, not per-run data.",
    atmo: [{ o2: 17, p: 50.7 }, { o2: 21, p: 101.3 }, { o2: 25, p: 152 }, { o2: 30, p: 304 }],
  },
  {
    id: "PSI-39", name: "CFI", category: "Liquid fuels", phase: "liquid",
    summary: "Cool-flame droplet tests with n-dodecane and dodecane/iso-dodecane blends at 0.5–5 atm, including helium dilution.",
    takeaway: "Cool flames are low-temperature, nearly invisible burning that can persist after the visible flame goes out. That is a hidden hazard for detectors and for crews.",
    fuel: "n-dodecane, iso-dodecane blends", geometry: "Free & fiber-supported droplets",
    o2: "17–21 %", pressure: "50–507 kPa", flow: "Quiescent", diluent: "N₂, He",
    sensors: "Droplet & flame imaging, radiometers",
    pillars: { prevention: 2, detection: 1, suppression: 2 }, scores: { safety: 2, realism: 2, model: 4 },
    rationale: "Mostly fundamental chemistry, with an indirect safety link through 'invisible' combustion.",
  },
  {
    id: "PSI-20", name: "ACME BRE", category: "Gaseous flames", phase: "gas",
    summary: "The Burning Rate Emulator feeds gas through 25 or 50 mm porous burners to mimic burning solids such as PMMA and nylon, in NASA's exploration atmospheres: 14.7 psi/21 %, 10.2 psi/26.5 % and 8.2 psi/34 % O₂.",
    takeaway: "The only PSI flight investigation run in Moon-base and rover atmospheres. With fuel fed in, flames kept burning in still air at up to 40 % O₂.",
    fuel: "Ethylene, methane (N₂-diluted)", geometry: "Porous flat burner, 25 & 50 mm",
    o2: "21–40 %", pressure: "56.5–101 kPa (8.2–14.7 psi)", flow: "Quiescent", diluent: "N₂",
    sensors: "Cameras, radiometers, heat-flux gauges, thermocouples",
    pillars: { prevention: 5, detection: 1, suppression: 4 }, scores: { safety: 5, realism: 3, model: 4 },
    rationale: "Exploration atmospheres plus a solid-fuel emulator make it the most habitat-relevant gas test.",
  },
  {
    id: "PSI-10", name: "ACME Flame Design", category: "Gaseous flames", phase: "gas",
    summary: "Spherical ethylene and propane diffusion flames, normal and inverse ('inside-out'), at 18–40 % O₂ and 1–3 atm, mapping when flames make soot and when they go out.",
    takeaway: "Its extinction criterion (flames die when the peak temperature drops below about 1130 K) and the soot limits feed fire models. Soot sets flame radiation and smoke yield.",
    fuel: "Ethylene, propane", geometry: "Spherical porous burner (normal & inverse)",
    o2: "18–40 % in the air · 85 % fed through the burner", pressure: "~94–304 kPa", flow: "Quiescent", diluent: "N₂, CO₂",
    sensors: "Color & IR cameras, radiometers, PMTs, thermocouples",
    pillars: { prevention: 3, detection: 2, suppression: 2 }, scores: { safety: 2, realism: 1, model: 5 },
    rationale: "Enriched-O₂ coverage and model-grade data, but a lab gas flame.",
  },
  {
    id: "PSI-159", name: "ACME CFI-G", category: "Gaseous flames", phase: "gas",
    summary: "Cool diffusion flames of ethane, propane and butane on a spherical burner. In inverse tests up to 85 % O₂ flowed from the burner, the highest oxygen levels in PSI.",
    takeaway: "Maps where cool flames appear (8 of 333 runs) versus hot ignition, including strongly oxygen-enriched conditions relevant to high-O₂ habitats and life-support leaks.",
    fuel: "Ethane, propane, n-butane", geometry: "Spherical porous burner (normal & inverse)",
    o2: "15–39 % in the air · up to 85 % fed through the burner", pressure: "50–331 kPa", flow: "Quiescent", diluent: "N₂",
    sensors: "Cameras, radiometers, PMTs, thermocouples",
    pillars: { prevention: 3, detection: 1, suppression: 1 }, scores: { safety: 3, realism: 1, model: 4 },
    rationale: "Highest-O₂ data in PSI, but a fundamental flame study.",
  },
  {
    id: "PSI-21", name: "ACME CLD Flame", category: "Gaseous flames", phase: "gas",
    summary: "Weak coflow methane and ethylene flames measured for shape, lift-off, temperature, soot and extinction limits across fuel dilutions.",
    takeaway: "Benchmark data to validate the soot and radiation sub-models used in fire simulations.",
    fuel: "Methane, ethylene (N₂-diluted)", geometry: "Coflow burner", o2: "Air coflow (~21 %)", pressure: "~101 kPa",
    flow: "Coflow air", diluent: "N₂", sensors: "Color cameras, OH*/CH* chemiluminescence, soot pyrometry",
    pillars: { prevention: 1, detection: 2, suppression: 1 }, scores: { safety: 1, realism: 1, model: 5 },
    rationale: "Excellent model data, weak direct safety link.", atmo: AIR,
  },
  {
    id: "PSI-22", name: "ACME E-FIELD", category: "Gaseous flames", phase: "gas",
    summary: "Applied up to 10 kV across laminar flames to see how the ions naturally present in flames move the gas, as a stand-in for buoyancy.",
    takeaway: "Electric-field 'ionic wind' can mimic partial gravity. With no Moon or Mars gravity data in PSI yet, this is the nearest proxy.",
    fuel: "Methane (diluted)", geometry: "Coflow & no-coflow burner with mesh electrode", o2: "Air (~21 %)", pressure: "~101 kPa",
    flow: "With & without coflow", diluent: "N₂", sensors: "Cameras, ion-current meter",
    pillars: { prevention: 1, detection: 0, suppression: 1 }, scores: { safety: 1, realism: 1, model: 3 },
    rationale: "Interesting partial-g analogue, little direct safety data.", atmo: AIR,
  },
  {
    id: "PSI-23", name: "ACME s-Flame", category: "Gaseous flames", phase: "gas",
    summary: "Transient spherical flames of H₂/CH₄ (soot-free) and ethylene (sooty) used to measure radiative and kinetic extinction.",
    takeaway: "Shows how large, slow-burning flames lose enough heat by radiation to go out on their own.",
    fuel: "H₂/CH₄, ethylene", geometry: "Spherical porous burner", o2: "~21 % (N₂)", pressure: "~101 kPa",
    flow: "Quiescent", diluent: "N₂", sensors: "Spectral imaging, radiometers, thermocouples",
    pillars: { prevention: 2, detection: 1, suppression: 2 }, scores: { safety: 2, realism: 1, model: 5 },
    rationale: "Model-grade extinction physics.", atmo: AIR,
  },
  {
    id: "PSI-107", name: "SPICE", category: "Gaseous flames", phase: "gas",
    summary: "469 jet-flame runs finding the 'smoke point', the fuel flow at which a flame starts releasing soot, for ethylene, propane and propylene mixes across nozzle sizes and coflow speeds.",
    takeaway: "Smoke point measures how sooty and radiant a fire is. Microgravity flames get sootier, which changes both the radiative heat a fire throws and the smoke detectors see.",
    fuel: "Ethylene, propane, propylene & blends", geometry: "Round nozzles 0.41/0.76/1.6 mm", o2: "Air coflow (~21 %)", pressure: "~101 kPa",
    flow: "5–65 cm/s coflow", diluent: "—", sensors: "DSLR imaging, flow meters",
    pillars: { prevention: 2, detection: 3, suppression: 1 }, scores: { safety: 3, realism: 2, model: 4 },
    rationale: "Large run count, link to smoke and radiation.", atmo: AIR,
  },
  {
    id: "PSI-106", name: "SLICE", category: "Gaseous flames", phase: "gas",
    summary: "Studied how laminar jet flames anchor and lift off in microgravity for different fuels, burner sizes and coflow speeds.",
    takeaway: "Flame anchoring and blow-off limits help predict whether a leak flame holds onto its source or blows out under cabin ventilation.",
    fuel: "Methane, ethylene (N₂-diluted)", geometry: "Exchangeable burner tubes", o2: "Air coflow (~21 %)", pressure: "~101 kPa",
    flow: "Coflow, fan-driven duct", diluent: "N₂", sensors: "High-res camera, flow & temperature sensors",
    pillars: { prevention: 1, detection: 1, suppression: 1 }, scores: { safety: 1, realism: 1, model: 4 },
    rationale: "Fundamental flame stability.", atmo: AIR,
  },
  {
    id: "PSI-101", name: "SAME-R", category: "Smoke & detection", phase: "aerosol",
    summary: "Heated Kapton, silicone, Teflon, lampwick and Pyrell foam to make smoke, then measured how the particles grow as they age in microgravity (109 runs).",
    takeaway: "Smoke particles grow differently by material: Kapton and Teflon smoke grew about 44 % in size versus about 23 % for Pyrell. Detectors must be tuned to microgravity smoke, not to Earth-calibrated smoke.",
    fuel: "Kapton, silicone, Teflon, lampwick, Pyrell foam", geometry: "Heated wire-wrapped samples",
    o2: "Cabin air", pressure: "ISS cabin (~101 kPa)", flow: "0–8.1 cm/s", diluent: "—",
    sensors: "Ionization & photoelectric detectors, DustTrak, P-Trak, M-pass, thermal precipitators",
    pillars: { prevention: 0, detection: 5, suppression: 0 }, scores: { safety: 5, realism: 4, model: 4 },
    rationale: "The key detection dataset, using real spacecraft materials.", atmo: AIR,
  },
  {
    id: "PSI-102", name: "SAME", category: "Smoke & detection", phase: "aerosol",
    summary: "The original smoke experiment: crew-run heating of spacecraft materials while flight-like detectors and samplers recorded the smoke.",
    takeaway: "Quantified how well existing ionization and photoelectric detectors see microgravity smoke, which is the basis for next-generation spacecraft detectors.",
    fuel: "Teflon, Kapton, silicone, cotton, DBP", geometry: "Heated samples",
    o2: "Cabin air", pressure: "ISS cabin (~101 kPa)", flow: "~5 cm/s", diluent: "—",
    sensors: "Ionization & photoelectric detectors, thermophoretic samplers (TEM)",
    pillars: { prevention: 0, detection: 5, suppression: 0 }, scores: { safety: 5, realism: 4, model: 3 },
    rationale: "Direct detector evaluation, with some sampler contamination noted.", atmo: AIR,
  },
  {
    id: "PSI-47", name: "DAFT / DAFT-2", category: "Smoke & detection", phase: "aerosol",
    summary: "Checked that a modified P-Trak particle counter, which normally relies on gravity, works in orbit, using Arizona road dust as a test aerosol.",
    takeaway: "Proved the instrument behind SAME smoke counts. The same dust-aerosol know-how carries over to lunar dust inside habitats.",
    fuel: "Arizona road dust (no combustion)", geometry: "Mylar aerosol bags", o2: "Cabin air", pressure: "ISS cabin",
    flow: "Sampled cabin air", diluent: "—", sensors: "Modified TSI P-Trak, DustTrak",
    pillars: { prevention: 0, detection: 4, suppression: 0 }, scores: { safety: 3, realism: 3, model: 1 },
    rationale: "Enabling instrument test, little combustion data.", atmo: AIR,
  },
  {
    id: "PSI-62", name: "Flame-spread modeling", category: "Solid materials", phase: "solid",
    summary: "Ground study building flamelet-manifold CFD for concurrent flame spread over PMMA sheets, spheres and rods, validated with BASS imagery.",
    takeaway: "Turns BASS data into a predictive tool that can screen new materials' flammability limits without flying each one.",
    fuel: "PMMA, wax (modeled)", geometry: "BASS sheets, spheres, rods", o2: "BASS conditions", pressure: "BASS conditions",
    flow: "BASS conditions", diluent: "—", sensors: "CFD + flight imagery",
    pillars: { prevention: 4, detection: 0, suppression: 1 }, scores: { safety: 4, realism: 4, model: 5 },
    rationale: "Predictive material screening.", inherits: ["PSI-25", "PSI-26"],
  },
  {
    id: "PSI-60", name: "SPICE analysis", category: "Gaseous flames", phase: "gas",
    summary: "Ground study that decoded more than 1600 SPICE flight images into soot temperature and volume-fraction maps and compared them with soot models.",
    takeaway: "Explains why microgravity flames are longer, cooler and sootier. That matters for predicting fire radiation and smoke yield.",
    fuel: "SPICE fuels", geometry: "SPICE nozzles", o2: "SPICE conditions", pressure: "SPICE conditions",
    flow: "SPICE conditions", diluent: "—", sensors: "Color-ratio pyrometry + CFD",
    pillars: { prevention: 2, detection: 2, suppression: 0 }, scores: { safety: 2, realism: 1, model: 4 },
    rationale: "Model refinement from flight images.", inherits: ["PSI-107"],
  },
  {
    id: "PSI-115", name: "SAME modeling", category: "Smoke & detection", phase: "aerosol",
    summary: "Direct numerical simulation of smoke-particle growth from a heated sample in microgravity versus Earth gravity, using the SAME geometry.",
    takeaway: "Explains the physics behind 'space smoke is different' and gives a tool for designing detectors before they fly.",
    fuel: "DBP (simulated)", geometry: "SAME-like duct", o2: "SAME conditions", pressure: "SAME conditions",
    flow: "Low cross-flow", diluent: "—", sensors: "DNS",
    pillars: { prevention: 0, detection: 4, suppression: 0 }, scores: { safety: 3, realism: 2, model: 4 },
    rationale: "Detector-relevant modeling.", inherits: ["PSI-102"],
  },
  {
    id: "PSI-117", name: "Cool-flame CFD", category: "Liquid fuels", phase: "liquid",
    summary: "3-D OpenFOAM model of droplet cool flames, validated against FLEX, testing how drift and heating push cool flames into hot ignition or extinction.",
    takeaway: "Defines when a cool flame (low-temperature, nearly invisible burning) can turn back into a hot flame: a re-flash risk after a fire seems out.",
    fuel: "n-alkanes (modeled)", geometry: "Droplets 0.5–4 mm", o2: "FLEX conditions", pressure: "FLEX conditions",
    flow: "Imposed drift/convection", diluent: "—", sensors: "CFD",
    pillars: { prevention: 2, detection: 0, suppression: 2 }, scores: { safety: 2, realism: 1, model: 5 },
    rationale: "Re-ignition physics.", inherits: ["PSI-69"],
  },
  {
    id: "PSI-142", name: "Cool-flame limits", category: "Liquid fuels", phase: "liquid",
    summary: "Ground counterflow experiments and simulations (ozone-assisted) charting how hot flames turn into cool flames and where their flammability limits lie.",
    takeaway: "Builds a combined hot/cool flammability diagram, so engineers can see conditions where a fire is 'out' visibly but still reacting.",
    fuel: "n-heptane, DME (modeled/ground)", geometry: "Counterflow burner", o2: "FLEX conditions", pressure: "Up to 20 atm (modeled)",
    flow: "Counterflow", diluent: "—", sensors: "Lab diagnostics + simulation",
    pillars: { prevention: 3, detection: 1, suppression: 2 }, scores: { safety: 3, realism: 1, model: 4 },
    rationale: "Flammability-limit theory.", inherits: ["PSI-69"],
  },
];

export const AI_BY_ID = Object.fromEntries(AI.map((a) => [a.id, a]));

export interface Habitat {
  id: string;
  name: string;
  o2: number; // %
  p: number; // kPa
  psi: number;
  note: string;
}

// NASA Exploration Atmospheres Working Group values, plus the challenge brief.
export const HABITATS: Habitat[] = [
  { id: "iss", name: "ISS / Earth sea level", o2: 21, p: 101.3, psi: 14.7, note: "Baseline for nearly every PSI flight test." },
  { id: "eva", name: "Exploration cabin (EVA prep)", o2: 26.5, p: 70.3, psi: 10.2, note: "Staged atmosphere that shortens spacesuit pre-breathe." },
  { id: "moon", name: "Moon base · pressurized rover", o2: 34, p: 56.5, psi: 8.2, note: "≥30 % O₂ at ≤10.2 psi per the challenge brief, which is over 40 % more oxygen than Earth air." },
  { id: "mars", name: "Mars base", o2: 30, p: 70.3, psi: 10.2, note: "≥30 % O₂ at ≤10.2 psi per the challenge brief, in 0.38 g Martian gravity, which NASA has never tested." },
];

export const HABITAT_SHORT: Record<string, string> = { iss: "ISS", eva: "Spacewalk-prep cabin", moon: "Moon base", mars: "Mars base" };

export const SUIT = { o2: 100, p: 29.6, psi: 4.3 };

export interface Finding {
  title: string;
  stat: string;
  statLabel: string;
  body: string;
  action: string;
  sources: string[];
  anchor: string;
  tone: "critical" | "serious" | "warning" | "good";
}

export const FINDINGS: Finding[] = [
  {
    title: "Moon-base air is almost untested for real materials",
    stat: "0", statLabel: "cabin-material tests in microgravity above 22.7 % O₂",
    body: "Every microgravity burn of a real cabin material in PSI (BASS, BASS-II, Saffire) ran at 13.6–22.7 % O₂ and ISS cabin pressure. The planned Moon base and rovers run at 30–34 % O₂ and lower pressure. Of 909 test points with a reported O₂ level, only 44 sit near Moon-base air, and none of them are fabrics or plastics.",
    action: "Prioritize solid-material flammability tests at 26.5–34 % O₂ and 8.2–10.2 psi. FM2 and LUCI are already planned.",
    sources: ["PSI-25", "PSI-26", "PSI-98", "PSI-99", "PSI-20"], anchor: "atmosphere", tone: "critical",
  },
  {
    title: "Fans off helps, but rich air narrows the margin",
    stat: "40 %", statLabel: "highest O₂ in BRE's still-air burns",
    body: "Shutting down ventilation is the standard first step and usually weakens a fire in microgravity. ACME BRE fed fuel into flames that imitate burning plastic and kept them burning in still air at 21–40 % O₂, including the 26.5 % and 34 % exploration atmospheres. A fire with its own fuel or heat source may not go out just because the fans stop.",
    action: "Keep fans-off as step one. In enriched-O₂ habitats also cut power and heat to the source and have suppression ready.",
    sources: ["PSI-20"], anchor: "atmosphere", tone: "serious",
  },
  {
    title: "Earth's material test was the harsher one in Saffire-II",
    stat: "9", statLabel: "Saffire-II samples burned both in space and on Earth",
    body: "No Saffire-II sample burned longer in microgravity than in its reference test on Earth. Thin silicone burned its full length on Earth but barely in space; SIBAL fabric burned fully in both. BASS tested whether strong airflow changes this, so the margin depends on material and airflow.",
    action: "Keep the Earth screening test, and add airflow-dependent microgravity limits for materials used in enriched-O₂ habitats.",
    sources: ["PSI-99", "PSI-25", "PSI-26"], anchor: "materials", tone: "warning",
  },
  {
    title: "Inert gases suppress, but fuels burn at surprisingly low O₂",
    stat: "12 %", statLabel: "O₂ at which methanol droplets still burned for up to 11 s",
    body: "At about 1 atm, FLEX methanol droplets burned for 5–11 s at just 12 % O₂ before going out. Adding CO₂ or helium pushed flames toward going out, but the helium runs also used less oxygen, so this table cannot rank one suppressant above the other.",
    action: "Size CO₂ and inert-gas suppression from microgravity limiting-O₂ data, not from Earth values.",
    sources: ["PSI-69", "PSI-68"], anchor: "suppression", tone: "warning",
  },
  {
    title: "Space smoke grows differently by material",
    stat: "1.44×", statLabel: "Kapton smoke particle growth vs 1.23× for Pyrell",
    body: "SAME-R aged smoke in microgravity. Kapton and Teflon particles grew about 44 % in size while Pyrell foam grew about 23 %. A detector tuned to one material's smoke can misread another's.",
    action: "Calibrate smoke detectors material by material, using particle sizes measured in microgravity.",
    sources: ["PSI-101", "PSI-102", "PSI-115"], anchor: "smoke", tone: "serious",
  },
  {
    title: "No Moon or Mars gravity data exists yet",
    stat: "0", statLabel: "partial-gravity combustion datasets in PSI",
    body: "All flight data is microgravity (~0 g), and ground tests sit at 1 g. Lunar (0.16 g) and Martian (0.38 g) fires do not simply fall in between: the ground work behind NASA's FM2 suggests some materials burn at lower O₂ in partial gravity than on Earth, because a weak upward flow can feed a flame well. E-FIELD's ionic wind is the only buoyancy proxy in PSI.",
    action: "Treat Moon and Mars gravity as untested, not as in-between. Add LUCI and FM2 data when it reaches PSI.",
    sources: ["PSI-22"], anchor: "gaps", tone: "critical",
  },
];

export const INCIDENTS = [
  { year: 1967, name: "Apollo 1", text: "Fire in a pure-O₂ cabin during a pre-launch test killed the crew of three." },
  { year: 1970, name: "Apollo 13", text: "An oxygen-tank explosion crippled the spacecraft on the way to the Moon." },
  { year: 1997, name: "Mir", text: "An oxygen-generator failure started a fire aboard the station. The multinational crew survived." },
  { year: 2026, name: "Artemis II", text: "A smoke alarm sounded about 80,000 miles from home." },
];

export const SPINOFFS = [
  { name: "Fine water mist extinguishers", text: "Developed for the ISS and now used on Earth, they put out fires with far less water damage.", link: "https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/" },
  { name: "Smoke & fire detectors", text: "NASA detector research led to better terrestrial smoke detection.", link: "https://spinoff.nasa.gov/node/9407" },
  { name: "Firefighter air tanks", text: "Lightweight composite breathing tanks adapted from space hardware in the 1970s.", link: "https://spinoff.nasa.gov/node/9582" },
  { name: "Protective fire attire", text: "Heat-resistant fabrics developed after Apollo 1 improved firefighter clothing.", link: "https://spinoff.nasa.gov/node/9918" },
];
