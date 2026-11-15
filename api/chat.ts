// Vercel serverless function: live "Ask the SI analyst" chat grounded in the PSI knowledge base.
// Uses GROQ_API_KEY (preferred) or ANTHROPIC_API_KEY from the Vercel project env. Without either, returns 503 and the UI uses offline retrieval.
import Anthropic from "@anthropic-ai/sdk";
import { AI, FINDINGS, HABITATS } from "../src/data/ai.js";
import { META } from "../src/data/meta.js";
import { GUIDE, GUIDE_URL, LESSONS } from "../src/data/kb.js";

const KNOWLEDGE = [
  "# NASA PSI combustion-science investigations (source: psi.nasa.gov, CC0)",
  ...AI.map((a) => {
    const m = META[a.id];
    return [
      `## ${a.id} ${a.name}: ${m.title}`,
      `${m.type} investigation | ${a.category} | hardware: ${m.hardware || "n/a"} | ${m.start ?? "?"} to ${m.end ?? "?"} | PI ${m.pi} | ${m.nTests} logged test rows | ${m.dataGB} GB | ${m.pubs} publications | DOI ${m.doi}`,
      `Summary: ${a.summary}`,
      `Fire-safety takeaway: ${a.takeaway}`,
      `Conditions: fuel ${a.fuel}; geometry ${a.geometry}; O2 ${a.o2}; pressure ${a.pressure}; flow ${a.flow}; diluent ${a.diluent}; sensors ${a.sensors}`,
      `SI scores (0-5): safety ${a.scores.safety}, material realism ${a.scores.realism}, model-ready ${a.scores.model}; pillars prevention ${a.pillars.prevention} detection ${a.pillars.detection} suppression ${a.pillars.suppression}. ${a.rationale}`,
    ].join("\n");
  }),
  "# Habitat atmospheres",
  ...HABITATS.map((h) => `- ${h.name}: ${h.o2}% O2 at ${h.psi} psi (${h.p} kPa). ${h.note}`),
  "- Spacesuit: 100% O2 at 4.3 psi.",
  "# Key findings computed from the PSI experimental tables",
  ...FINDINGS.map((f) => `- ${f.title} (${f.stat} ${f.statLabel}). ${f.body} Action: ${f.action} Sources: ${f.sources.join(", ")}`),
  "# Lessons, past spacecraft fires and planned experiments (curated, each with its source)",
  ...LESSONS.map((l) => `- ${l.title}. ${l.text} Source: ${l.source}`),
].join("\n\n");

const RULES = `You are the SI analyst inside "Flame in Freefall", a NASA Space Apps dashboard about microgravity combustion data from NASA's Physical Sciences Informatics (PSI) database.
Audience: aerospace engineers, researchers and students working on fire safety for spacecraft, space stations, Moon/Mars bases and pressurized rovers.

Answer only from the knowledge base below. Cite investigations by name and PSI id, for example "BASS-II (PSI-25)". If the data does not cover something (partial gravity, solids above 22.7% O2), say so plainly and suggest which investigation comes closest. Never invent numbers.
Keep answers under 180 words. Use short paragraphs or a few bullets, and end with one practical implication for fire-safety design.
Rocket and propellant fire safety is outside PSI's scope; say so if asked.
Stay inside what the data shows. Do not claim fires "persist" or "grow" when airflow is removed: still air usually weakens a microgravity fire, and ventilation shutdown is standard practice. ACME BRE fed fuel into its flames, so its still-air burns do not prove a real solid keeps burning. For ventilation questions give both sides with counts: BRE flames burned with no airflow at 21–40 % O2, while in BASS-II at least 15 of 129 runs lowered the airflow until the flame went out. Do not rank helium against CO2 from FLEX (helium runs also used less oxygen). Do not say Moon or Mars fires fall between microgravity and 1 g; partial gravity can be worse than both.
Write in plain language for a non-specialist. Formatting: plain sentences, **bold** for key terms and "- " bullets only. No tables, no headings, no italics.`;
const SYSTEM = `${RULES}

${KNOWLEDGE}`;

// Small-context models (Groq free tier caps a request at ~8k tokens): one line per investigation,
// full detail only for the few that best match the question, plus habitats and findings.
const words = (s: string) => new Set(s.toLowerCase().replace(/o₂/g, "o2").split(/[^a-z0-9]+/).filter((w) => w.length > 2));
const DOCS = AI.map((a) => ({ a, w: words(`${a.id} ${a.name} ${META[a.id].title} ${a.category} ${a.summary} ${a.takeaway} ${a.fuel} ${a.o2} ${a.pressure} ${a.diluent} ${a.sensors}`) }));
// Passages of the NASA Researcher's Guide to ISS Combustion Science that best match the question.
const GDOCS = GUIDE.map((g) => ({ g, w: new Set(g.text.toLowerCase().replace(/o₂/g, "o2").split(/[^a-z0-9]+/).filter((w) => w.length > 3)) }));
function guidePassages(question: string, k = 3) {
  const q = [...new Set(question.toLowerCase().replace(/o₂/g, "o2").split(/[^a-z0-9]+/).filter((w) => w.length > 3))];
  const top = GDOCS.map((d) => ({ d, s: q.filter((w) => d.w.has(w)).length })).filter((x) => x.s >= 2).sort((a, b) => b.s - a.s).slice(0, k);
  if (!top.length) return "";
  return `\n\n# Passages from the NASA Researcher's Guide to ISS Combustion Science (2015), ${GUIDE_URL}\nCite as "NASA Researcher's Guide".\n` + top.map((x) => x.d.g.text.slice(0, 1400)).join("\n---\n");
}

function compactSystem(question: string, k = 6) {
  const q = words(question);
  const top = DOCS.map((d) => ({ d, s: [...q].filter((w) => d.w.has(w)).length })).sort((x, y) => y.s - x.s).slice(0, k).map((x) => x.d.a);
  return [
    RULES,
    "# All PSI combustion investigations (one line each)",
    ...AI.map((a) => `- ${a.id} ${a.name} (${META[a.id].type}, ${a.category}): ${a.takeaway} O2 ${a.o2}; pressure ${a.pressure}.`),
    "# Detail for the investigations most relevant to this question",
    ...top.map((a) => `## ${a.id} ${a.name}
${a.summary}
Conditions: fuel ${a.fuel}; geometry ${a.geometry}; flow ${a.flow}; diluent ${a.diluent}; sensors ${a.sensors}; ${META[a.id].nTests} test rows.`),
    "# Habitat atmospheres",
    ...HABITATS.map((h) => `- ${h.name}: ${h.o2}% O2 at ${h.psi} psi (${h.p} kPa).`),
    "# Key findings from the PSI tables",
    ...FINDINGS.map((f) => `- ${f.title} (${f.stat} ${f.statLabel}). ${f.body} Sources: ${f.sources.join(", ")}`),
  ].join("\n");
}

let client: Anthropic | undefined; // lazy: constructor throws when ANTHROPIC_API_KEY is unset

const TEXT_HEADERS = { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" };

// Groq retires models over time. If the configured one is gone (404), ask Groq which chat models
// this key can use and take the first preferred match, so chat keeps working without a redeploy.
const GROQ = "https://api.groq.com/openai/v1";
const PREFER = [/llama-3\.3-70b/, /gpt-oss-120b/, /llama-4/, /70b/, /gpt-oss/, /llama/, /qwen/];
let groqModel = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

async function pickGroqModel() {
  const res = await fetch(`${GROQ}/models`, { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` } });
  if (!res.ok) return null;
  const ids: string[] = ((await res.json()).data ?? []).filter((m: any) => m.active !== false).map((m: any) => m.id);
  const chat = ids.filter((id) => !/whisper|guard|tts|orpheus|playai|distil|embed/i.test(id));
  for (const p of PREFER) {
    const hit = chat.find((id) => p.test(id));
    if (hit) return hit;
  }
  return chat[0] ?? null;
}

// Groq: OpenAI-compatible chat completions, streamed as SSE and re-emitted as plain text.
async function groq(messages: { role: "user" | "assistant"; content: string }[], ctx: string) {
  const recent = messages.slice(-6);
  const asked = recent.filter((m) => m.role === "user").map((m) => m.content).join(" ");
  const system = compactSystem(asked) + guidePassages(asked, 2) + ctx;
  const call = (model: string) =>
    fetch(`${GROQ}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({ model, stream: true, max_tokens: 1500, messages: [{ role: "system", content: system }, ...recent] }),
    });
  let res = await call(groqModel);
  if (res.status === 404 || res.status === 400) {
    const next = await pickGroqModel();
    if (next && next !== groqModel) {
      console.warn(`groq model ${groqModel} unavailable, switching to ${next}`);
      groqModel = next;
      res = await call(groqModel);
    }
  }
  if (!res.ok || !res.body) {
    console.error(`groq ${res.status} (${groqModel}): ${(await res.text()).slice(0, 300)}`);
    return new Response(`groq ${res.status}`, { status: 502 });
  }
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  const reader = res.body.getReader();
  let buf = "";
  const body = new ReadableStream({
    async start(ctrl) {
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const line of lines) {
            const data = line.startsWith("data: ") ? line.slice(6).trim() : "";
            if (!data || data === "[DONE]") continue;
            const text = JSON.parse(data).choices?.[0]?.delta?.content;
            if (text) ctrl.enqueue(enc.encode(text));
          }
        }
      } catch {
        ctrl.enqueue(enc.encode("\n\n(Live SI error. Please retry.)"));
      }
      ctrl.close();
    },
  });
  return new Response(body, { headers: TEXT_HEADERS });
}

export async function POST(req: Request) {
  if (!process.env.GROQ_API_KEY && !process.env.ANTHROPIC_API_KEY) return new Response("no key", { status: 503 });

  let messages: { role: "user" | "assistant"; content: string }[];
  let ctx = "";
  try {
    const body = await req.json();
    if (typeof body.habitat === "string") ctx = `\n\nThe user is currently viewing this habitat: ${body.habitat.slice(0, 100)}. Prefer answers relevant to it.`;
    messages = (body.messages ?? [])
      .filter((m: any) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-10)
      .map((m: any) => ({ role: m.role, content: String(m.content).slice(0, 2000) }));
    if (!messages.length || messages[messages.length - 1].role !== "user") throw new Error();
  } catch {
    return new Response("bad request", { status: 400 });
  }
  if (process.env.GROQ_API_KEY) return groq(messages, ctx);
  ctx += guidePassages(messages.filter((m) => m.role === "user").slice(-2).map((m) => m.content).join(" "));

  const stream = (client ??= new Anthropic()).beta.messages.stream({
    model: "claude-opus-5-5",
    max_tokens: 8000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low" },
    system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }, ...(ctx ? [{ type: "text" as const, text: ctx.trim() }] : [])],
    messages,
  });

  const enc = new TextEncoder();
  const body = new ReadableStream({
    async start(ctrl) {
      try {
        for await (const ev of stream) {
          if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") ctrl.enqueue(enc.encode(ev.delta.text));
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") ctrl.enqueue(enc.encode("\n\n(The model declined to answer this one. Try rephrasing.)"));
      } catch (e) {
        ctrl.enqueue(enc.encode(`\n\n(Live SI error: ${e instanceof Anthropic.APIError ? e.status : "network"}. Please retry.)`));
      }
      ctrl.close();
    },
  });
  return new Response(body, { headers: TEXT_HEADERS });
}
