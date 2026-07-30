import { computeReviewInsights } from "@/lib/kairo/review-insights";
import type { GoalWithNodes } from "@/types";

// The one thing a chat window cannot do, shown rather than claimed.
//
// Every sentence in this section is PRINTED BY THE APP. It calls the same
// computeReviewInsights the product runs, on a fixture of three goals, and
// renders whatever comes back. Nothing here is copywriting dressed as output, so
// it cannot drift away from what the product actually says.
//
// Timestamps are fixed rather than relative to Date.now(), so the server and the
// client render identical text and the numbers never wobble between visits.
const NOW = Date.parse("2026-07-01T09:00:00Z");
const DAY = 86_400_000;
const at = (daysFromNow: number) => new Date(NOW + daysFromNow * DAY).toISOString();

const goal = (o: Partial<GoalWithNodes>): GoalWithNodes => ({
  id: "g", userId: "u", title: "", description: "", status: "active",
  progress: 0, targetDate: null, icon: null, notes: "",
  createdAt: at(-42), updatedAt: at(-1), archivedAt: null, nodes: [],
  ...o,
} as GoalWithNodes);

const node = (title: string, daysSinceTouched: number): GoalWithNodes["nodes"][number] =>
  ({
    id: `n${title}`, goalId: "g", parentId: null, title, description: "",
    status: "in_motion", progress: 40, priority: 3, estimatedMinutes: 45,
    dueDate: null, positionX: null, positionY: null, aiReason: "",
    resource: null, createdAt: at(-40), updatedAt: at(-daysSinceTouched),
  } as GoalWithNodes["nodes"][number]);

// Six weeks in, on three goals with real deadlines. One slipping, one holding,
// one untouched for a fortnight.
//
// Spans are kept to roughly ten weeks on purpose. The projection is linear, so a
// goal that is barely started against a distant date honestly returns something
// like "19 weeks late": correct, but it reads as a broken number rather than a
// useful one. Goal-sized deadlines keep the arithmetic in the range where it is
// actually actionable, which is a real lesson about the product, not just about
// this fixture.
const FIXTURE: GoalWithNodes[] = [
  goal({ id: "a", title: "Run a half marathon", progress: 45, targetDate: at(28), nodes: [node("Build to 10k", 9)] }),
  goal({ id: "b", title: "Conversational Spanish", progress: 60, targetDate: at(28) }),
  goal({ id: "c", title: "Start the side business", progress: 42, targetDate: at(28), updatedAt: at(-14) }),
];

const TONE: Record<string, string> = {
  behind: "text-warn",
  overdue: "text-warn",
  on: "text-sage",
  ahead: "text-sage",
  none: "text-faint",
  done: "text-sage",
};

export function KeepsCount() {
  const r = computeReviewInsights(FIXTURE, NOW);

  return (
    <section className="mx-auto max-w-3xl px-5 max-lg:pl-12 py-24">
      <h2 data-journey="keeps" className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        It keeps count.
      </h2>
      <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-muted">
        Solaspace stores every step with a status and a date, then does the arithmetic. Not a
        summary of a conversation. A record, and the truth about your pace.
      </p>

      <div className="mt-10 border-t border-line pt-8">
        {/* Says "example" plainly. The output is genuinely the app's, but the goals
            are invented, and blurring that line would be the same lie as a fake
            testimonial. */}
        <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-faint">
          An example, six weeks in. Every line below is printed by the app.
        </p>

        <p className="mt-5 text-[19px] leading-snug text-ink">{r.headline}</p>

        <ul className="mt-8 space-y-5">
          {r.pace.map((p) => (
            <li key={p.goalId} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line pb-5">
              <span className="text-[17px] text-ink">{p.title}</span>
              <span className={`font-mono text-[14px] ${TONE[p.state] ?? "text-muted"}`}>{p.verdict}</span>
            </li>
          ))}
        </ul>

        {r.stalled.map((s) => (
          <p key={s.nodeTitle} className="mt-6 text-[17px] text-muted">
            <span className="text-ink">{s.nodeTitle}</span> has not moved in {s.days} days.
          </p>
        ))}
        {r.neglected.map((n) => (
          <p key={n.goalId} className="mt-2 text-[17px] text-muted">
            You have not touched <span className="text-ink">{n.title}</span> in {n.days} days.
          </p>
        ))}
      </div>
    </section>
  );
}
