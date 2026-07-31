import {
  Repeat, PenLine, PlayCircle, BookOpen, Search, Phone, MessageCircle,
  CalendarClock, ClipboardPen, Wallet, Wrench, Code, Palette, Hammer, Camera,
  GraduationCap, Gauge, Send, Mic, Dumbbell, Utensils, Layers, Scale,
  ListChecks, Flag, ArrowRight, type LucideIcon,
} from "lucide-react";
import type { GoalNode } from "@/types";

// Every step gets an icon, deterministically: zero tokens, no schema change,
// works retroactively on every legacy row, every hand-typed node, and every
// mock. An AI-chosen key can override this later; nothing here is wasted.
//
// Resolution order:
//  1. resource.kind, when present: the attached content names the activity.
//  2. First matching keyword rule below, against the lowercased title, then
//     the firstAction if the title says nothing.
//  3. Fallback: a chapter (childful milestone) flies a Flag, a step an
//     ArrowRight. Never a bare dot again.
//
// Done state and recurrence are row FURNITURE (check glyph, cadence label),
// never the icon slot, so a workout practice reads Dumbbell, not a generic
// Repeat.
//
// RULE ORDER IS LOAD-BEARING:
//  - "practice/drill" (1) before the fitness row (20), so "run through the
//    set" reads as practice, not running.
//  - "book a" (8) is a phrase on purpose: it catches "book a court" without a
//    bare "book" token, which keeps "read a book" on rule 4.
//  - design (13) before decide (23), so "pick colors" reads as design.
const RULES: [RegExp, LucideIcon][] = [
  [/\b(practice|drill|rehearse|warm up|reps|run through)\b/, Repeat],
  [/\b(write|draft|outline|journal|script|essay|blog)\b/, PenLine],
  [/\b(watch|video|tutorial|course|lecture|episode)\b/, PlayCircle],
  [/\b(read|article|chapter|docs|guide|textbook)\b/, BookOpen],
  [/\b(research|find|search|look up|compare|gather|collect)\b/, Search],
  [/\b(call|phone)\b/, Phone],
  [/\b(email|message|text|ask|reach out|contact|invite|feedback|meet|interview|talk to)\b/, MessageCircle],
  [/\b(book a|schedule|appointment|block time|calendar)\b/, CalendarClock],
  [/\b(sign up|register|apply|enroll|join|subscribe)\b/, ClipboardPen],
  [/\b(buy|order|purchase|price|budget|save|pay)\b/, Wallet],
  [/\b(set up|install|configure|download|connect)\b/, Wrench],
  [/\b(code|debug|deploy|refactor|program)\b/, Code],
  [/\b(design|sketch|wireframe|mockup|layout|logo|colou?rs?)\b/, Palette],
  [/\b(build|make|create|assemble|prototype|put together)\b/, Hammer],
  [/\b(record|film|shoot|photograph|photo)\b/, Camera],
  [/\b(learn|memorize|study|flashcard|vocab|quiz)\b/, GraduationCap],
  [/\b(test|measure|track|weigh|benchmark|review)\b/, Gauge],
  [/\b(publish|launch|ship|post|submit|release|share)\b/, Send],
  [/\b(present|pitch|demo|perform|play for|speech|speak)\b/, Mic],
  [/\b(run|walk|jog|lift|gym|workout|train|stretch|swim|ride)\b/, Dumbbell],
  [/\b(cook|meal|recipe|bake|prep)\b/, Utensils],
  [/\b(clean|organize|sort|declutter|tidy)\b/, Layers],
  [/\b(decide|choose|pick|commit)\b/, Scale],
  [/\b(plan|map out|list|prioritize|break down|brainstorm)\b/, ListChecks],
];

function byKeywords(text: string): LucideIcon | null {
  const t = text.toLowerCase();
  for (const [re, icon] of RULES) if (re.test(t)) return icon;
  return null;
}

/**
 * The icon for one step. `chapter` marks a childful milestone, which falls back
 * to a Flag instead of a step's ArrowRight when no rule matches.
 */
export function nodeIcon(
  node: Pick<GoalNode, "title" | "firstAction" | "resource">,
  opts?: { chapter?: boolean },
): LucideIcon {
  if (node.resource?.kind === "watch") return PlayCircle;
  if (node.resource?.kind === "read") return BookOpen;
  if (node.resource?.kind === "practice") return Repeat;
  return (
    byKeywords(node.title) ??
    (node.firstAction ? byKeywords(node.firstAction) : null) ??
    (opts?.chapter ? Flag : ArrowRight)
  );
}
