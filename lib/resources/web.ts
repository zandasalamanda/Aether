import "server-only";
import type { ResolvedResource } from "@/types";
import { isObj } from "@/lib/ai/provider";

// Resolve a "read" step's search intent to ONE real page via Gemini's Google
// Search grounding. The URL comes from groundingMetadata (a real Google result,
// not model-invented), so it can't be hallucinated. Returns null with no key or
// no result — the caller then falls back to a live search link (never a dead one).

const NATIVE = "https://generativelanguage.googleapis.com/v1beta";
const MODEL = process.env.AI_RESEARCH_MODEL || process.env.AI_MODEL || "gemini-3.1-flash-lite";
const apiKey = () => process.env.AI_API_KEY || process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY || "";

const SYSTEM =
  "Find the single best, most authoritative page a person should open to do this. " +
  "Reply with just a short, plain title for that page (a few words). Do not paste the URL.";

export async function resolveArticle(query: string): Promise<ResolvedResource | null> {
  const key = apiKey();
  if (!key || !query.trim()) return null;
  try {
    const res = await fetch(`${NATIVE}/models/${MODEL}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": key, "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [{ parts: [{ text: `Best page to read for: ${query}` }] }],
        tools: [{ google_search: {} }],
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    const cand = isObj(data) && Array.isArray(data.candidates) ? data.candidates[0] : null;
    const content = isObj(cand) && isObj(cand.content) ? cand.content : null;
    const parts = content && Array.isArray(content.parts) ? content.parts : [];
    const answer = parts.map((p) => (isObj(p) && typeof p.text === "string" ? p.text : "")).join("").trim();

    const gm = isObj(cand) && isObj(cand.groundingMetadata) ? cand.groundingMetadata : null;
    const chunks = gm && Array.isArray(gm.groundingChunks) ? gm.groundingChunks : [];
    for (const c of chunks) {
      const web = isObj(c) && isObj(c.web) ? c.web : null;
      const url = web && typeof web.uri === "string" ? web.uri : "";
      if (!url) continue;
      const site = web && typeof web.title === "string" ? web.title.trim() : "";
      const title = (answer || site || "Open the best result").slice(0, 140);
      const source = site && site.toLowerCase() !== title.toLowerCase() ? site : domainOf(url) || "the web";
      return { url, title, source, thumbnail: null };
    }
    return null;
  } catch {
    return null;
  }
}

// Bare hostname, minus the Google grounding-redirect hosts (which aren't the publisher).
function domainOf(url: string): string {
  try {
    const h = new URL(url).hostname.replace(/^www\./, "");
    return /vertexaisearch|googleusercontent|(^|\.)google\.com$/.test(h) ? "" : h;
  } catch {
    return "";
  }
}
