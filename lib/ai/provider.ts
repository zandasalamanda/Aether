import { features } from "@/lib/config";
import { isNativeUserAgent } from "@/lib/native-ua";

// Provider-agnostic AI adapter over the OpenAI-compatible Chat Completions API.
// Works with any such endpoint by setting AI_BASE_URL + AI_MODEL + AI_API_KEY:
//   Gemini (default):  https://generativelanguage.googleapis.com/v1beta/openai  ·  gemini-flash-lite-latest
//   DeepSeek:          https://api.deepseek.com                                 ·  deepseek-chat
//   OpenAI:            https://api.openai.com/v1                                ·  gpt-4.1-mini
//   Groq / OpenRouter / Together: their base URL + model
// Every caller falls back to a deterministic mock when this returns null, so the
// app is fully usable with no key and safe even if a response is malformed.

const BASE = (process.env.AI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta/openai").replace(/\/+$/, "");
// Pinned to the exact cheapest available model (2.5/2.0 flash-lite are retired) so
// "…-latest" can't silently drift onto a pricier model. Override with AI_MODEL.
const MODEL = process.env.AI_MODEL || "gemini-3.1-flash-lite";
const apiKey = () => process.env.AI_API_KEY || process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY || "";

export function isObj(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

export const isClient = () => typeof window !== "undefined";

export interface RouteResult<T> { data: T | null; status: number; error?: string; upgrade?: boolean }

/** Browser → server route (key stays server-side), preserving the HTTP status so
 *  callers can tell a rate-limit / upgrade / outage apart from a valid empty result. */
export async function viaRouteResult<T>(path: string, input: unknown): Promise<RouteResult<T>> {
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    if (res.ok) return { data: (await res.json()) as T, status: res.status };
    let error: string | undefined;
    let upgrade: boolean | undefined;
    try {
      const b: unknown = await res.json();
      if (isObj(b)) {
        if (typeof b.error === "string") error = b.error;
        if (typeof b.upgrade === "boolean") upgrade = b.upgrade;
      }
    } catch {
      /* non-JSON error body */
    }
    return { data: null, status: res.status, error, upgrade };
  } catch {
    return { data: null, status: 0 };
  }
}

/** From the browser, run an AI task through its server route (key stays server-side). */
export async function viaRoute<T>(path: string, input: unknown): Promise<T | null> {
  return (await viaRouteResult<T>(path, input)).data;
}

/** True when this code is running inside the native shell's WKWebView.
 *  SSR-safe: no `navigator` on the server, where it reports false and the
 *  server-supplied `error` string (already native-aware in lib/ai/guard.ts) wins. */
function nativeShell(): boolean {
  return typeof navigator !== "undefined" && isNativeUserAgent(navigator.userAgent);
}

/** A human message for a failed AI route, tuned to the status (limit / upgrade / outage).
 *  App Store Guideline 3.1.1: inside the native shell no message may name a paid tier
 *  or point at a purchase route, so the 402 fallback is neutral there. The server
 *  normally supplies its own `error`; these are the last-resort fallbacks. */
export function aiErrorText(r: { status: number; error?: string }): string {
  if (r.status === 401) return "Please sign in to use Solaspace's AI.";
  if (r.status === 402) {
    if (nativeShell()) return "That feature isn't available on this plan.";
    return r.error || "That's a Pro feature. Upgrade in Settings under Billing to unlock it.";
  }
  if (r.status === 429) return r.error || "You've reached today's AI limit. It resets soon.";
  if (r.status === 0) return "You seem to be offline. Check your connection and try again.";
  return r.error || "Sola couldn't respond just now. It may be busy. Try again in a moment.";
}

/** A typed error for blocking AI responses (sign-in / upgrade / rate-limit) so the
 *  UI can show a popup or redirect instead of rendering the message inline. */
export class AiError extends Error {
  status: number;
  upgrade: boolean;
  constructor(status: number, message: string, upgrade = false) {
    super(message);
    this.name = "AiError";
    this.status = status;
    this.upgrade = upgrade;
  }
}

/** Throw an AiError for statuses the UI should surface as a popup / redirect.
 *  `upgrade` drives an "Upgrade to Pro" button / a push to /app/billing, so it is
 *  always false inside the native shell (Guideline 3.1.1: no route to a purchase).
 *  On the web a 402 implies an upgrade even when the body omits the flag. */
export function raiseIfBlocked(r: { status: number; error?: string; upgrade?: boolean }): void {
  if (r.status === 401 || r.status === 402 || r.status === 429) {
    const upgrade = !nativeShell() && (r.status === 402 || !!r.upgrade);
    throw new AiError(r.status, aiErrorText(r), upgrade);
  }
}

function extractJson(text: string): unknown {
  const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const m = cleaned.match(/[[{][\s\S]*[\]}]/);
    if (m) {
      try {
        return JSON.parse(m[0]);
      } catch {
        /* fall through */
      }
    }
    return null;
  }
}

/** Ask the model for JSON matching a shape. Returns null on any failure. */
export async function generateJson<T>(system: string, user: string, opts?: { maxTokens?: number }): Promise<T | null> {
  if (!features.ai || !apiKey()) return null;
  try {
    const res = await fetch(`${BASE}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey()}` },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.4,
        // Default suits short answers; big structured outputs (the goal map's 14-18
        // rich nodes) pass a larger budget so the JSON never truncates mid-string.
        max_tokens: opts?.maxTokens ?? 1600,
        messages: [
          { role: "system", content: `${system}\n\nReturn ONLY a valid minified JSON object, with no surrounding prose and no code fences around the JSON. String values inside it may contain rich markdown: headings, bullet and numbered lists, tables, and fenced code blocks (including diagrams tagged mermaid).` },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    const choice = isObj(data) && Array.isArray(data.choices) ? data.choices[0] : null;
    const message = isObj(choice) && isObj(choice.message) ? choice.message : null;
    const text = message ? String(message.content ?? "") : "";
    return extractJson(text) as T | null;
  } catch {
    return null;
  }
}
