// Deterministic plain-English deadline parser. Stands in for the real AI's
// date extraction so goals can take a deadline written naturally
// ("by September", "in 3 weeks", "before Friday", "2026-09-01").

export interface ParsedDeadline {
  iso: string;
  label: string;
}

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
// Each pattern matches the full month name or its common abbreviation.
// Non-capturing sub-groups so day extraction can rely on group indices.
const MONTHS = [
  "jan(?:uary)?", "feb(?:ruary)?", "mar(?:ch)?", "apr(?:il)?", "may", "jun(?:e)?",
  "jul(?:y)?", "aug(?:ust)?", "sep(?:t(?:ember)?)?", "oct(?:ober)?", "nov(?:ember)?", "dec(?:ember)?",
];

function noon(y: number, m: number, d: number): Date {
  return new Date(y, m, d, 12, 0, 0, 0);
}

function mk(d: Date): ParsedDeadline {
  return { iso: d.toISOString(), label: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) };
}

export function parseDeadline(text: string, now: Date = new Date()): ParsedDeadline | null {
  const t = text.toLowerCase();

  // ISO: 2026-09-01
  const iso = t.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
  if (iso) return mk(noon(+iso[1], +iso[2] - 1, +iso[3]));

  // Numeric: 9/1 or 09/01/2026
  const md = t.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (md) {
    let year = md[3] ? +md[3] : now.getFullYear();
    if (year < 100) year += 2000;
    const d = noon(year, +md[1] - 1, +md[2]);
    if (!md[3] && d.getTime() < now.getTime()) d.setFullYear(year + 1);
    return mk(d);
  }

  // Relative: in 3 weeks / in 10 days / in 2 months
  const rel = t.match(/\bin\s+(\d+)\s+(day|week|month)s?\b/);
  if (rel) {
    const n = +rel[1];
    const d = new Date(now);
    if (rel[2] === "day") d.setDate(d.getDate() + n);
    else if (rel[2] === "week") d.setDate(d.getDate() + n * 7);
    else d.setMonth(d.getMonth() + n);
    d.setHours(12, 0, 0, 0);
    return mk(d);
  }

  if (/\btomorrow\b/.test(t)) { const d = new Date(now); d.setDate(d.getDate() + 1); d.setHours(12, 0, 0, 0); return mk(d); }
  if (/\bnext week\b/.test(t)) { const d = new Date(now); d.setDate(d.getDate() + 7); d.setHours(12, 0, 0, 0); return mk(d); }
  if (/\bnext month\b/.test(t)) { const d = new Date(now); d.setMonth(d.getMonth() + 1); d.setHours(12, 0, 0, 0); return mk(d); }
  if (/\bend of (the )?month\b/.test(t)) return mk(noon(now.getFullYear(), now.getMonth() + 1, 0));
  if (/\bend of (the )?year\b/.test(t)) return mk(noon(now.getFullYear(), 11, 31));

  // Weekday: by Friday / on monday → next occurrence
  const wd = WEEKDAYS.findIndex((w) => new RegExp(`\\b${w}\\b`).test(t));
  if (wd >= 0) {
    const d = new Date(now);
    let add = (wd - d.getDay() + 7) % 7;
    if (add === 0) add = 7;
    d.setDate(d.getDate() + add);
    d.setHours(12, 0, 0, 0);
    return mk(d);
  }

  // Month, optional day: "by September", "sept 15", "3rd of March"
  const mi = MONTHS.findIndex((m) => new RegExp(`\\b(?:${m})\\b`, "i").test(t));
  if (mi >= 0) {
    const m = MONTHS[mi];
    const dayMatch = t.match(new RegExp(`\\b(?:${m})\\b\\s+(\\d{1,2})|\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?\\b(?:${m})\\b`, "i"));
    const raw = dayMatch ? Number(dayMatch[1] ?? dayMatch[2]) : 1;
    const day = Number.isFinite(raw) ? Math.min(Math.max(raw, 1), 31) : 1;
    let d = noon(now.getFullYear(), mi, day);
    if (d.getTime() < now.getTime()) d = noon(now.getFullYear() + 1, mi, day);
    return mk(d);
  }

  return null;
}
