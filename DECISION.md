I verified the load-bearing code and computed the Mirror fixture with the real function before writing this. Findings that change the plan are marked inline.

---

# Solaspace: the decision

**Zander. 27 July 2026.**

---

## 1. THE DECISION

**Build Solaspace for doctoral candidates who are writing to a submission date.** Specifically: the ABD candidate, coursework finished, six to twenty four months from submission or defence, somewhere between 40% and 70% written, with one chapter they have not opened in weeks.

For that person, Solaspace is **the thing that keeps an actual record of the work and tells them, in days, whether they are going to make their date.** Not a writing tool. Not a chatbot. A ledger with arithmetic on top.

This means letting go of the general audience. "Are you ready to get things done?" is written for everyone, which is why it converts nobody and why your friend said he would just use ChatGPT. He was right, for him. He is not the customer. The four showcase goals on the current page (financial freedom, get in shape, learn a language, launch a side project) are the exact four goals every generic AI productivity homepage ships, and they are the clearest evidence that the page has no audience. That part hurts and it is the whole unlock.

You are not throwing the product away. You are pointing the same product at the one person for whom its weirdest feature is the only feature that matters.

---

## 2. WHY THIS AND NOT THE OTHERS

Three directions were seriously worked up. Two lose. Stop carrying them.

**Direction B, "The Living Map" (self-directed adult learners).** The page craft was excellent. The audience is a psychographic, not a place. There is no subreddit for "adults teaching themselves something substantial", no coach who already bills them, no September cohort, no writing centre to email. The only way to reach that person is paid acquisition, which you do not have. Worse, it puts your most copyable feature in the hero (a researched link per step is a grounded search call that Perplexity does free) and demotes your only architectural advantage to a captioned footnote. **Rejected because it answers "what is this" and not "who is this for", which is half your question.**

**Direction A, "The Overrun" (a four field pace calculator in the hero).** Beautiful signature (an engineering caliper measuring the days you will overshoot). It does not survive contact with the code. I ran its own default persona through `pace()` in `/Users/zander/Documents/KairoApp/lib/kairo/review-insights.ts`: started May 2025, 45% drafted, due March 2027 returns roughly **307 days late**, not the 41 the whole page is designed around. The estimator is `lateDays = span × (f − p) / p`, so it grows with the span. Over a two year thesis it emits numbers that read as broken, and it emits them loudest to the person in the most pain. **Rejected because its flagship number does not compute, and the fix is not a copy edit.**

**Direction C, "The Gap" (editorial manifesto, dissertation writers). This is the one.** Correct audience, correct metaphor, correct restraint, and it is the only direction whose Mirror copy respects what the code can actually emit. It had four truth failures and one commercial hole. All five are fixed below. That is what you are building.

**And the certification pivot that was floated earlier: dead.** Every cert provider worth money bundles the study planner free. Becker ships one inside a $3,000 CPA course. Kaplan Schweser Premium ships an "Activity Feed study plan" and a "Performance Tracker" (your Mirror, given away). Cram Fighter is roughly $100 one time and its headline feature is literally rescheduling you when you fall behind. Where nobody bundles a planner (AWS, Azure) the buyer is a software engineer, the most ChatGPT fluent human alive. Do not build it.

---

### The two findings that make this direction work, which nothing else in your materials had

**Finding 1: map chapters, not theses.** The linear estimator is well behaved over short spans and absurd over long ones. A whole thesis goal returns "49 weeks late". A single chapter with a supervisor agreed date returns "5 days late" or "6 weeks late", which is credible, checkable, and actionable. So the product guidance is **one chapter, one goal.** Put it in onboarding, put it in the FAQ.

This also fixes your pricing. `planLimits.free.activeGoals` is 2. A thesis is five or six chapters. Chapter scoping turns the free tier from "a thesis is one goal so nobody ever pays" into an honest, non manipulative reason Pro exists.

**Finding 2: the Mirror is back-loaded, and one day of product work un-back-loads it.** `rate = progress / (now − createdAt)`. A goal created today has zero elapsed and zero progress, so a brand new user gets "Not started, 8 months left" no matter how hard their deadline is. I checked `/Users/zander/Documents/KairoApp/components/kairo/OnboardingFlow.tsx`: there is no start date question and no way to mark existing work done. **Build that step before you build the page.** Dissertation writers are the one segment that arrives carrying the history the Mirror needs, and right now you throw it away at the door.

---

## 3. THE PAGE

Seven sections, down from eleven. Zero panels. One accent. One ambient motion.

### The metaphor, so every later decision derives instead of being chosen

Your page currently runs two metaphors at once: a **galaxy** (starfield, orbs, planets) and a **luxury** one (gold, glass, blur). Neither describes what the product does. That is the actual source of the mix and match feeling, not the section order.

The true metaphor is **the instrument.** Warm gold on near black is not fashion houses, it is chronometer dials, aircraft instrument lighting and ledger foil. The Mirror is a readout. Once that is settled: hairlines instead of panels, tabular mono numerals instead of decorative figures, one lit gold object per view, depth from hierarchy rather than blur. Your palette was already right. Only the story about it was generic.

### Signature element: THE PACE RULE

Every horizontal divider on the page is a data visualisation of the product's core mechanism. It is the widget `ReviewMirror.tsx` already renders at lines 49 to 62, stripped to line art and stretched to full column width.

Anatomy, a 3px track, no radius:
- gold `#e6b877` for what is finished
- `#6b5540` for the gap between that and where you should be by now
- warm hairline for the time still left
- one 11px vertical tick in `#efe9dd` marking today, sitting at (gold + gap)

It appears seven times: once in the hero and once at the top of each section. The gold segment grows and the gap shrinks each time:

| Instance | gold | gap | tick |
|---|---|---|---|
| Hero | 34% | 22% | 56% |
| §2 | 41% | 19% | 60% |
| §3 | 55% | 14% | 69% |
| §4 | 68% | 10% | 78% |
| §5 | 79% | 7% | 86% |
| §6 | 91% | 3% | 94% |
| §7 (closer) | 100% | none | **tick suppressed** |

The reader is never told this is happening. The page's furniture closes the gap as you scroll, so by the closer the argument has been made twice, once in language and once in the structure. §3 names it out loud after the reader has already seen it three times. It carries no digits, ever. One presentational component, widths as props, an IntersectionObserver one shot draw. No canvas, no library.

### Typography

Three faces, three jobs. **Serif is the person. Mono is the arithmetic.** The page alternates between them, and that alternation is the pitch: you have feelings about your dissertation, it has a ledger.

- **Display: Newsreader** via `next/font/google`, variable, `opsz` axis, weights 400 to 600 plus italic 400. Production Type. The voice of the record: reportage, not luxury. Large x-height and sturdy stems, so it survives on near black where Instrument Serif or Cormorant thin out.
- **Body: Geist Sans** 400/500. Already installed, zero download, already the CSS body default.
- **Utility: Geist Mono** 500, uppercase, tracking 0.16em to 0.18em. Labels, dates, every number, every verdict string.

> **De-risking note.** Do **not** repoint `--font-display` to Newsreader. That token has 63 call sites across the app and it would blow up every in-app screen. Add a **new** token `--font-record` and use it only on the landing. Retiring Sora app wide is a separate later pass, not part of this build.

**Non-negotiable one-liner:** `font-variant-numeric: tabular-nums` on every figure in §3 and on the prices. Digits that change width when a projection updates destroy the instrument illusion in one frame.

Newsreader Italic 400 is permitted **exactly twice** on the whole page, both times on a form of the word "meant": the word "meaning" in the H1 and "meaning" in the closer sub. Italic means the self you did not become. Nowhere else.

**The scale.** Add to `@theme` in `/Users/zander/Documents/KairoApp/app/globals.css`. There is currently no scale at all, and roughly nine distinct sizes under 16px, which is the real reason the page reads as amateur before anyone consciously registers why.

```
--text-manifesto:  clamp(2.75rem, 8.2vw, 5.75rem) / 0.98 / -0.015em   Newsreader 500
--text-closer:     clamp(3.25rem, 11vw, 7.5rem)   / 0.94 / -0.02em    Newsreader 500
--text-display-l:  clamp(1.875rem, 4vw, 2.75rem)  / 1.06 / -0.012em   Newsreader 500
--text-display-m:  1.5rem   / 1.20 / -0.01em                          Newsreader 500
--text-body-l:     1.1875rem / 1.60                                   Geist Sans 400
--text-body:       1rem      / 1.60                                   Geist Sans 400
--text-label:      0.75rem   / 1 / 0.18em uppercase                   Geist Mono 500
--text-micro:      0.6875rem / 1 / 0.16em uppercase                   Geist Mono 500
```

Eight steps. No arbitrary bracket sizes anywhere on the landing. Closer at 120px against body-l at 19px is **6.3:1**. The current page runs 2.4:1 across the board, which is the flatness. Note that **section headings get smaller**, from 30 to 36px down to 24 to 44px display-l. Only two elements on the page are enormous.

### Colour

Six tokens. Three exist, three are new. Scope the new ones to a `.record` wrapper class so the app is untouched.

| Token | Value | Job |
|---|---|---|
| `--color-canvas` | `#0a0b0d` | The ground. Unchanged. Do not purify to `#000000`, it smears on OLED. |
| `--color-accent` | `#e6b877` | Four uses on the whole page: the italic word "meaning", the gold segment of every pace rule, the two buttons, the eyebrow at `#b28e5c`. Nothing else. |
| `--color-ink-warm` | `#efe9dd` | **NEW.** Display type only. Warm marks on a black field read as printed ink under a lamp. Body copy stays on the cool `#f2f3f5` / `#9a9ea8`, so warmth belongs to the voice and coolness to the information. |
| `--color-gap` | `#6b5540` | **NEW.** The accent with the light drained out. The distance between where you are and where you should be. Deliberately not red (red is blame, and this audience is already ashamed) and not grey (grey is meaningless). The gap is your own gold gone dim. |
| `--color-rule` | `rgba(239,233,221,0.10)` | **NEW.** Every hairline. Warm tinted to match the ink. Rules do all the layout work here, so this is a small change with a large cumulative effect. |
| `--color-sage` | `#8fae9f` | The on-track row in §3, and nowhere else. A colour that only appears when something is going well. |

**Surfaces: the landing uses `.panel` zero times.** All 21 bordered panels go. Exactly three non-canvas surfaces survive: the `.raised-gold` buttons (unchanged, `globals.css` 459 to 478), the `.grid-veil` backdrop behind the map in §4 (finally giving that orphaned class its one intended use), and the `.chrome` research sheet inside ShowcaseTree, which is product chrome.

### Spacing rhythm

8px base. Page margin `clamp(20px, 7vw, 96px)`. Content column max 1080px, left aligned within it, never centred except the closer.

Every section: **pace rule (full column width) → 48px → mono section index and title on one baseline → 32px → content.** Section vertical padding 120px desktop, 72px mobile. Block gaps inside a section: 40px. Prose measures: 46ch for the lede, 62ch for body.

### Motion budget

One ambient motion on the whole page and it is the goal map drawing itself.

- **Load, once:** the hero pace rule draws from 0 to its widths over 900ms on `cubic-bezier(0.22, 1, 0.36, 1)` with a 250ms delay, while the H1 uses the existing `animate-fade-up`. Nothing else moves. The first thing the page does is take a measurement.
- **Scroll reveal:** existing `Reveal`, retuned to 320ms, 12px y offset so it reads as a fade not a slide. Never more than 6 staggered children at 60ms.
- **Each pace rule** draws its gold and gap on entry, 700ms, one shot.
- **Ambient, one only, in §4:** ShowcaseTree's existing connector draw staggered by radial distance, plus the permanent `animate-flow` dash on the `m0` connector. That is the entire ambient budget.
- **Hover:** 150ms, colour and opacity only, zero displacement.
- **Deleted:** Starfield, `animate-breathe`, `animate-pulse-soft`, both blur blobs, the AppShots cursor relay, the scroll cue chevron. That is four competing ambient loops removed. Ambient motion everywhere reads as a template; one expensive motion in one place reads as craft.
- **Reduced motion:** all pace rules render at final widths immediately, the map draws instantly, the flow dash stops. The global kill switch at `globals.css` 504 to 511 covers the reveal layer; the pace rule needs its own guard because it animates a width, not a transform.

---

### Section by section

**HEADER.** Fixed, 56px, canvas at 92% opacity with **no backdrop blur** (frosted chrome is a 2026 tell and it is being removed). One 1px `--color-rule` bottom border. Logo left. Right: "Sign in" in Geist Sans 15px muted, then a small `.raised-gold` button, "Start".

---

**1. HERO.** Full viewport, `min-h-[88svh]`. Left aligned to the page margin, ragged right, max width 900px, content block sitting at roughly 40% of viewport height. Left aligned display type is the manifesto register; centred display type on a dark field is the templated premium SaaS default, and centring is used exactly once on this site, in the closer.

*Job: name the audience in the first 40 pixels, land the line, plant the pace rule unexplained, and capture one micro commitment.*

Order: eyebrow (the only eyebrow on the page) → H1 at `--text-manifesto` in `--color-ink-warm`, with "meaning" in Newsreader Italic gold → 28px → the pace rule at 34/22/56, unlabelled → 28px → sub at `--text-body-l` muted, 46ch → 40px → the input row → micro line.

**The input row is the one change from the original spec, and it is deliberate.** A single bare field on a 1px hairline, no box, no fill, no radius: `What are you finishing, and when is it due?`. On blur or submit, `parseDeadline` from `/Users/zander/Documents/KairoApp/lib/kairo/deadline.ts` runs client side with zero AI and echoes the resolved date and day count underneath in mono 11px: `30 SEPTEMBER 2026. 65 DAYS.` Beside the field, one `.raised-gold` button, "Start".

Why this and not a four field calculator: days until a date is arithmetic that **cannot be wrong**. It plants the instrument idea, gives a real payoff before the auth wall, captures the highest intent moment, and hands the parsed date across to onboarding via the existing `PENDING_KEY` handoff. It does not bet the hero on a naive extrapolation that explodes at the tails.

No scroll cue. The hero's bottom 18% is dead empty. Emptiness is the invitation.

---

**2. THE SEVENTEEN DAYS.** *Job: kill the "just use ChatGPT" objection in the first scroll, with a fact and an open concession, not a comparison table.* A table here reads as defensive. Two lines on an empty field read as confidence.

Layout: pace rule → section index `01 / WHY NOT CHATGPT` → line A at `--text-display-m` in muted → line B at `--text-display-l` in ink-warm, 24px below → 40px → body at 62ch → 40px → the CONCEDED block, which is a mono label above a paragraph, indented 40px from the column with a 1px `--color-rule` on its left edge. That left rule is the only place on the page where a block is marked out, and it marks the moment you give ground.

---

**3. IT KEEPS THE RECEIPTS.** *Job: show the Mirror as a live readout, server rendered by the real `computeReviewInsights` on canned data at a fixed `nowMs`, labelled honestly.*

**This is the page's second register, and it must be genuinely dense.** Sections 2, 5, 6 and 7 are warm type on black with a lot of air. If §3 is also airy, the page is monotonous in the opposite direction from the current one. So §3 is a tight mono block with real mass: 13px Geist Mono, tabular nums, 1.5 leading, rows separated by `--color-rule` hairlines at 1px, no gaps between them. It should look like a printout.

Each row: goal title in Geist Sans 15px ink / verdict string in mono 13px (behind rows in `--color-gap`, on-track row in `--color-sage`) / the forked ReviewMirror bar with its elapsed tick / caption `62% DONE · 70% OF TIME GONE` in mono 11px faint. Then the stalled row underneath, mono, in `--color-gap`.

**Build rule, and this is not negotiable:** feed the canned goals to `computeReviewInsights` and render whatever it returns. Do not paste the numbers. The section's own label claims every figure is printed by the code, and that label has to be true. The fixture below is already computed and verified.

Below the readout, this is where the pace rule gets explained. The reader has now seen it three times.

Full bleed the mono block edge to edge on desktop while the prose stays in the 62ch column. That contrast is what makes the empty sections read as deliberate.

---

**4. FIRST IT HAS TO KNOW THE WAY.** *Job: the interactive proof, and the second CTA at peak conviction.*

Remount `/Users/zander/Documents/KairoApp/components/kairo/LiveMapDemo.tsx`, which currently has **zero call sites**. It already has the `.grid-veil` backdrop, the interactive `ShowcaseTree`, cursor parallax, and a CTA. Kill its 8.5s auto cycle and dot pagination (dots say carousel, which says advertisement). Replace the dots with the five map names in mono, the active one in gold.

Give ShowcaseTree a container at least 640px wide on desktop so its `ResizeObserver` at line 96 picks the right flowing roadmap orientation. Add one optional `maxHeight` prop so the landing can raise the `MAXH = 460` cap at line 179 to about 560. That is a one token edit and everything re-derives.

This section holds the page's only ambient motion. It ends with the goal input repeated and the second Start button.

---

**5. WHAT IT WILL NOT DO.** *Job: trust through named limitation, plus a dated founder note. Highest trust per pixel available to a product with zero users, and almost nobody ships it.*

Four limitations as four blocks, each a Newsreader `--text-display-m` line followed by one Geist Sans sentence, 40px apart, no borders, no icons, no bullets. Then a `--color-rule` hairline, then the founder note: mono date label, a real photograph at 88px square with a 1px rule and no radius, four sentences in Geist Sans, signature.

---

**6. PRICE.** *Job: two prices in plain type on hairlines. No cards, no badge, no glow.* Two columns hung off the column, each: mono plan label / mono price with tabular nums / one Geist Sans sentence / the feature list in Geist Sans 15px with 1px `--color-rule` separators, no ticks, no icons. Then six FAQ `<details>` on hairline rules, disclosure triangle rotation as the only animation.

---

**7. FINISH THE THING.** *Job: the promise as a three word imperative in the biggest type on the page, on an otherwise empty field.*

Pace rule at 100% gold, tick suppressed, full bleed. Then 120px of nothing. Then the closer at `--text-closer`, centred, the only centred block on the entire site. Sub beneath it with the second and final italic. One gold button. Nothing else in the viewport.

**FOOTER.** Geist Mono 11px, one line, one tagline.

---

## 4. THE COPY

Paste ready. No em dashes anywhere. Every claim checked against the code.

### Header
```
Sign in
Start
```

### 1. HERO

```
Eyebrow:  WRITTEN FOR PEOPLE FINISHING A DISSERTATION

H1:       Become who you keep meaning to be.
          ("meaning" in Newsreader Italic, gold)

[pace rule]

Sub:      You already know what you are supposed to be doing. Solaspace is
          the part that keeps a record of whether you are actually doing it,
          and tells you the truth about your date.

Input placeholder:  What are you finishing, and when is it due?
Date echo (mono):   30 SEPTEMBER 2026. 65 DAYS.
Button:             Start

Micro:    FREE TO START. NO CARD. NOTHING ON THIS PAGE COSTS YOU AN ACCOUNT.
```

### 2. THE SEVENTEEN DAYS

```
Index:    01 / WHY NOT CHATGPT

Line A:   ChatGPT will write your chapter.
Line B:   It will not notice that you have not opened chapter three
          in seventeen days.

Body:     Ask it again tomorrow and it starts fresh. It remembers you as a
          short summary of a conversation, not as a record of what you
          finished and when. Solaspace stores a row for every step, with a
          status and a timestamp, and does arithmetic on it. That is a
          different kind of thing, not a smarter one, and a better model
          does not close the difference.

Label:    CONCEDED
Body:     ChatGPT writes better plans than we do. It is better at rethinking
          one out loud with you at eleven at night, and it is better at
          helping with the actual writing. We are not trying to win that.
          We are the thing that is still counting after you close the tab.
```

### 3. IT KEEPS THE RECEIPTS

**The fixture below is computed, not written.** I ran it through `computeReviewInsights` at `nowMs = Date.parse("2026-07-27T09:00:00Z")` with three chapter goals. These are the exact strings the function returns.

```
Index:    02 / THE RECORD

Heading:  It keeps the receipts.

Label:    SIMULATED. A CANDIDATE THREE MONTHS INTO THREE CHAPTERS. EVERY
          FIGURE BELOW IS PRINTED BY THE SAME FUNCTION THE APP RUNS.

[readout]

2 of 3 timed goals are slipping behind pace.

Chapter 4: Results and analysis
Behind, on this pace you finish ~6 weeks late
38% DONE · 45% OF TIME GONE

Chapter 3: Methodology
Behind, on this pace you finish ~5 days late
60% DONE · 62% OF TIME GONE

Literature review revisions
On track for your deadline
88% DONE · 86% OF TIME GONE

STALLED     Rewrite the sampling section. In motion, untouched 17 days.
DRIFTING    Chapter 4: Results and analysis. Nothing touched in 12 days.

Body:     No model produced those sentences. A finish date is projected from
          how much you have actually done and how long it actually took, then
          compared against the date you gave it. A step counts as stalled when
          you mark it in motion and then do not touch it for seven days. A goal
          counts as drifting after ten. Those two numbers are constants in the
          file that does the calculation. They are the same for everybody and
          they will be the same tomorrow.

Body:     You have been reading this shape all the way down the page. Gold is
          what is finished. The dim band is the distance between that and where
          you should be by now. The mark is today. It is the only picture this
          product draws, and it is the only one worth drawing.
```

*Fixture data for the build, so the numbers reproduce exactly:*

| Goal | progress | createdAt | targetDate | node |
|---|---|---|---|---|
| Chapter 4: Results and analysis | 38 | now − 108d | now + 132d | one `not_started`, updated 12d ago; goal `updatedAt` 12d ago |
| Chapter 3: Methodology | 60 | now − 93d | now + 57d | "Rewrite the sampling section", `in_motion`, updated 17d ago; goal `updatedAt` 3d ago |
| Literature review revisions | 88 | now − 103d | now + 17d | one `in_motion`, updated 2d ago; goal `updatedAt` 1d ago |

Use the existing `goal()` and `node()` factories at `/Users/zander/Documents/KairoApp/lib/kairo/review-insights.test.ts` lines 10 to 27. Fix `nowMs` as a constant, never `Date.now()`, so the page is deterministic and hydration safe.

### 4. FIRST IT HAS TO KNOW THE WAY

```
Index:    03 / THE MAP

Heading:  First it has to know the way.

Body:     Say what you are trying to finish and roughly when. Solaspace lays
          out the whole path in order, then attaches a real source to the
          steps that need one. Not a summary of a source. A named publisher
          and a working link you can open right now, in this tab, before you
          give us anything.

Map label (mono):  FIVE EXAMPLE MAPS, WRITTEN AND CHECKED BY HAND.
                   EVERY LINK IN THEM IS REAL. OPEN ONE.

Body:     In your own map, Solaspace goes and looks for the resource itself.
          When it finds something solid it attaches it with the publisher
          named. When it cannot, it hands you the search it would have run
          rather than a link that does not work.

Input placeholder:  What are you finishing, and when is it due?
Button:             Start
Micro:              NOTHING IS GENERATED UNTIL YOU HAVE AN ACCOUNT.
```

> **Why the wording changed.** `/Users/zander/Documents/KairoApp/lib/kairo/showcase-maps.ts` says in its own header that the maps are hardcoded and hand checked, not AI generated. Labelling them as product output would be the same category of thing as the fake "Most popular" badge. And `GalaxyMap.tsx` lines 75 to 76 build a Google or YouTube search URL when the resolver returns null, so "you never open a search box" is a claim the product contradicts on a bad day. The honest version is stronger anyway: it tells the reader exactly what happens when it fails.

### 5. WHAT IT WILL NOT DO

```
Index:    04 / LIMITS

Heading:  What it will not do.

It will not write your chapter.
That is deliberate. Your committee can tell, and so can you.

It will not nag you.
Reminders are quiet and you can turn them off entirely. No streaks, no
badges, no counter that resets when you miss a day.

It will not know anything about your field.
It knows your dates, your steps, and what you have actually finished. Your
supervisor and your reading list still do the rest.

It cannot make you open the document.
Nothing can. It can only make it impossible to keep pretending you did.

Label:    27 JULY 2026
```

**FOUNDER NOTE: you write this one.** Do not paste mine. Four sentences, first person, your own words, a real photograph, and the date. The date is what makes it read as a note rather than as copy. Constraints for it: admit you are one person, admit there are almost no users, say one specific true thing about why you built the pace calculation, and give people a way to tell you it is wrong. Do not claim a team, funding, or a roadmap.

Here is the shape, not the words:

```
I built this because I kept telling myself I was nearly done with things I
had not opened in a month. Solaspace is new and I am building it on my own,
which you can probably tell. I built the pace arithmetic before I built any
of the AI, because it was the part I could not get anywhere else. If you use
it and it is wrong for you, write to me and tell me exactly where it failed.
I read all of it.

Zander, Solaspace
```

### 6. PRICE

```
Index:    05 / PRICE

Heading:  Price.

FREE · $0
Two goals. The full map, the daily plan, the researched sources, and the
weekly reading of your pace.
  Up to 2 active goals
  Goal maps and a daily focus plan
  Hand-picked videos and guides for each step
  Progress recorded as you mark steps done
  Reminders and a weekly digest
  Weekly progress review

PRO · $10 A MONTH, OR $96 A YEAR
Unlimited goals, coaching on any step, and deeper research.
  Unlimited goals
  Ask Sola for coaching on any step
  Deep research with cited sources
  Share your progress with a supervisor or a group
  Priority AI and much higher limits

Body:     Map one chapter at a time and two goals is often enough. Plenty of
          people will never need to pay. A thesis is usually five or six
          chapters, and if you want them all running at once, that is Pro.

Micro:    PAYMENTS RUN THROUGH STRIPE, SO WE NEVER SEE YOUR CARD. CANCEL IN
          ONE CLICK. YOU KEEP PRO UNTIL THE PERIOD YOU PAID FOR ENDS.
```

> **Three corrections against the code.** (a) `lib/config.ts` sets `yearly.amount = 96`, not 60. Every draft you have been handed says $60 and it is wrong. Read from `priceDisplay` and never hardcode. (b) There is no premium model tier. `lib/ai/provider.ts` line 16 pins `gemini-3.1-flash-lite` for free and Pro alike, and `lib/ai/guard.ts` gates on rate limits and feature flags, not model quality. Never write "the full model". (c) The pace review is a **free** feature, so forecasting cannot be listed as a Pro differentiator when the hero promises it unconditionally.

### FAQ (six disclosures on hairline rules)

```
Q: Should one goal be my whole thesis?
A: No. One chapter, one goal, with the date you agreed with your supervisor.
   The pace reading is sharper over months than over years, and a chapter is
   the unit you actually work in.

Q: I am already halfway through. Does that break it?
A: The opposite. Tell it when you started and tick off what is already done,
   and it can project your finish date on the first screen instead of waiting
   a fortnight to learn your pace.

Q: What powers the AI, and what does not use AI at all?
A: Language models map your goal and break the steps down. The pace
   projection, the stalled step warnings and the weekly reading use no AI at
   all. They are arithmetic over what you have recorded, which is why they
   cannot hallucinate and cannot flatter you.

Q: Is this going to cause me a problem with my department?
A: It does not write your thesis and it produces nothing you submit. It is a
   project manager for a piece of work you are doing yourself.

Q: What happens to my data?
A: Your goals and your progress are yours. Stored securely, never sold, and
   you can delete your account and everything in it from Settings at any time.

Q: What if I fall behind?
A: You will. That is the case it was built for. It reschedules what slipped
   and rebuilds today around the time and energy you actually have, and it
   keeps showing you the real date either way.
```

**FAQ question two only ships after the onboarding step exists.** Until then it is a promise the product bounces in ninety seconds. That is why it is Phase 0 and not Phase 5.

### 7. CLOSER

```
[pace rule, 100% gold, no tick, full bleed]

Closer:   Finish the thing.
Sub:      You have been meaning to for a long time.
          ("meaning" in Newsreader Italic, the second and final italic)
Button:   Start
```

### Footer

```
© 2026 Solaspace. Map the way. Build the day.
```

One tagline. The page currently ships two.

---

## 5. WHAT GETS DELETED

All line numbers verified in `/Users/zander/Documents/KairoApp/app/page.tsx` today.

**Delete first, before any design work: the fake "Most popular" badge, line 191.** It is the single element on the page a skeptical reader can *prove* is invented, and it sits directly beside the honest pricing you need them to believe. It costs you every other claim on the page. Ten seconds of work, and it is unambiguously right.

| Cut | Where | Why it makes the page better |
|---|---|---|
| Headline "Are you ready to get things done?" | Hero | A yes/no infomercial question files you under generic task apps. Every reference page in the category leads with a claim or a category, never a question. Your best line was buried at 92% scroll depth; it moves to the top. |
| `BEATS` three card grid | lines 21 to 25, 105 to 119 | Three rounded cards in a row with thin line icons in tinted chips is the loudest AI design tell that exists. It is the layout Tailwind tutorials used to demonstrate a grid, and it is in your file verbatim. The map and the readout demonstrate all three beats in less height. |
| `PILLARS` grid | lines 28 to 33, 146 to 165 | The same pattern again, forty lines later, in two columns. |
| All 21 bordered panels | throughout | Thirteen are pure text in a box. The landing uses `.panel` zero times after this. Structure comes from hairlines and space. |
| `Starfield` | line 54 | Space wallpaper is the most generic AI app decoration of the last three years, and it belongs to a galaxy metaphor that describes nothing the product does. The goal map survives as a product surface. The cosmos goes as brand. |
| Both blur blobs | lines 190, 230 | `bg-accent/20 blur-3xl` and `bg-accent/15 blur-[90px] animate-breathe`. Depth comes from hierarchy and rules, not from blur. |
| Five of six `SectionLabel` eyebrows | lines 101, 126, 135, 146, 171, 211 | An eyebrow used once is emphasis. Six times is a template. One survives, in the hero, doing the audience filtering. |
| The frosted header | line 80 | `backdrop-blur-xl`. Glassmorphism is a tell. Flat canvas at 92% plus one warm hairline. |
| `AppShots` and all five PNGs | lines 132 to 141, `public/shots/` | **This is the hard one, and it is the right cut.** It is genuinely clever craft. It is also why static images own 36% of your page while the live map owns 8%, and the map shot alone takes 18.4 seconds to tell a story `ShowcaseTree` tells in three. That ratio has to invert and the honest way to invert it is to remove the static half. Keep the file, unmount it, reclaim about 1.5MB. |
| `GoalOrb` in the hero | `HeroSayItSeeIt.tsx:41` | Beautiful, and it belongs to the metaphor being retired. |
| `ExamplePlanDemo` wrapper and its `max-w-3xl` | lines 122 to 130 | Your strongest anti-ChatGPT evidence is currently boxed into 768px with a 6 second auto advance. The map moves to §4 at full width. |
| The second tagline "Chart it. Focus. Arrive." | line 255 | Two competing taglines on one page is literally the mix and match problem in miniature. |
| Hardcoded Pro price `"10"` in the JSON-LD | line 69 | Read from `priceDisplay` so the schema cannot drift from config. |
| Two of five `SHOWCASE_MAPS` | `lib/kairo/showcase-maps.ts` | "Build financial freedom" and "Plan the trip of a lifetime" are the exact goals on every generic AI productivity homepage. Replace with a dissertation chapter plan and a thesis timeline carrying real, hand verified academic methods sources. `ShowcaseTree` renders with zero AI, so this is data, not engineering. |
| "Do it for me" drafts from the marketed Pro list | `lib/kairo/plans.ts:21` | Keep the feature, bury the pitch. Advertising drafting to academics is poison and it directly contradicts "It will not write your chapter" sitting twenty inches above it. Rename to nothing; just remove it from the displayed list. |
| `STREAK_MILESTONES` | `components/kairo/MomentumStrip.tsx:21-25` | In app, not on the landing, but it is a live violation of your own no-streaks rule and a dissertation writer will hit it in week one. |

**Two things stay deleted that you will be tempted to bring back:** `HeroCluster.tsx` stays orphaned (229 lines of drag-to-spin planet orbit, genuinely impressive, and a toy that reinforces the metaphor you are killing), and the `.panel` recipes stay in `globals.css` untouched because the app uses them everywhere. They simply do not appear on the marketing page.

**One thing survives untouched: `isNativeRequest()` at line 49.** That is your App Store Guideline 3.1.1 guard and it must be the first thing in the new page component, before any render.

---

## 6. WHAT WE REUSE

You own far more than you think. This is mostly assembly.

| File | Where it lands |
|---|---|
| `lib/kairo/review-insights.ts` → `computeReviewInsights` | §3, called directly in the server component with canned goals and a hardcoded `nowMs`. Its only import is an `import type`, it never calls `Date.now()`, and it touches no network, DB or AI. Fully server renderable and deterministic. |
| `lib/kairo/review-insights.test.ts` lines 10 to 27 | The `goal()` and `node()` factories are ready made canned data builders. Lift them into a landing fixture. |
| `components/kairo/ReviewMirror.tsx` lines 49 to 62 | The progress bar with the elapsed tick. **Fork the markup, do not import the component.** It wraps rows in `<Link href="/app/map?goal=...">` which 404s a logged out visitor, and it calls the `useGoalColors()` client hook. Pass the hex directly. This is also the geometry of the pace rule. |
| `components/kairo/LiveMapDemo.tsx` | §4, in full. Currently **zero call sites**. Kill the auto cycle and dots, keep the grid-veil, the cursor parallax, the pause on hover and the stop on interact. |
| `components/kairo/ShowcaseTree.tsx` | Unchanged except one optional `maxHeight` prop to raise the `MAXH` cap at line 179. Container must be ≥640px wide on desktop for the roadmap orientation (line 96). |
| `lib/kairo/showcase-maps.ts` | Two entries replaced, structure untouched. |
| `lib/kairo/deadline.ts` → `parseDeadline` | The hero input's date echo. Handles "by September", "in 8 months", ISO and `9/1`, client side, zero AI. |
| `components/kairo/HeroSayItSeeIt.tsx` lines 29 to 35 | The `sessionStorage` `PENDING_KEY` handoff. The plumbing already works; `OnboardingFlow.tsx` lines 143 to 146 already reads and clears it. Extend the payload from a bare string to `{ title, deadlineIso }`. |
| `components/kairo/Reveal.tsx` | Retuned to 320ms / 12px, used at most six times, once per section, never per card. |
| `components/ui/Button.tsx` + `.raised-gold` (globals 459 to 478) | The two buttons, untouched. Keep its `before:-inset-2` trick that gets a 32px visual button to a 48px tap target. |
| `components/ui/ExternalLink.tsx` | Every outbound source link. |
| `.grid-veil` (globals 497 to 502) | §4 backdrop. Currently referenced only inside the orphaned `LiveMapDemo`, so it renders on zero live pages. This gives it its one intended use. |
| `lib/kairo/plans.ts` | `PLAN_FREE_FEATURES`, `PLAN_PRO_FEATURES`, `priceDisplay`, so landing, billing and the upgrade modal never drift. |
| `lib/native.ts` → `isNativeRequest` | Line 49, first thing in the component. |
| Geist Sans and Geist Mono | Already installed, zero download cost. |

---

## 7. THE BUILD ORDER

Six phases. Each ends at something shippable.

**PHASE 0 · Make the page's promise true (1 day). AI can do this.**
This comes before any design work because without it the landing writes a cheque the product bounces in ninety seconds.
1. Add a "Where are you now?" step to `components/kairo/OnboardingFlow.tsx`, after the map is generated. Two questions: "When did you start this?" (month/year chips, sets `goal.createdAt` to the first of that month) and "Which of these have you already done?" (a checklist of the generated milestones, marking those nodes `done`). Goal progress recomputes automatically through the existing path at `lib/data/actions.ts` lines 151 to 157.
2. Onboarding copy nudges chapter scoping: "One chapter, one goal, with the date you agreed with your supervisor."
3. Harden `humanDays` in `review-insights.ts` with one line: `if (d >= 365) return "over a year";`. A real user with a long span will otherwise see "52 weeks late", which reads as broken.
4. Echo the pending goal on `app/sign-up/page.tsx`. About ten lines. Right now the highest intent moment on the site sends a person who just typed their thesis title to a bare Clerk form that never mentions it.
5. Remove `"Do it for me" drafts` from `PLAN_PRO_FEATURES` display, and change `"Progress tracked automatically"` to `"Progress recorded as you mark steps done"`.
6. Delete `STREAK_MILESTONES` from `MomentumStrip.tsx`.

*Ships as: the Mirror produces a real projection within ninety seconds of signup instead of in week two.* Typecheck, test, build, deploy.

**PHASE 1 · The deletions (half a day). AI can do this.**
The badge at line 191 first. Then BEATS, PILLARS, AppShots, Starfield, both blobs, five eyebrows, the frosted header, the second tagline, the JSON-LD hardcoded price. Do not add anything. Ship the page shorter and plainer than it was.

*Ships as: an honest, unimpressive page. It will look worse for one day. That is fine, and it is the point.*

**PHASE 2 · Tokens and type (half a day). AI can do this.**
Add `--font-record` (Newsreader), the eight step type scale, and the three new colour tokens scoped to a `.record` class. Do not touch `--font-display`. Add `tabular-nums` to `.font-mono`.

**PHASE 3 · The pace rule and the hero (1 day). AI can do this.**
Build `PaceRule` as one presentational component taking `gold`, `gap` and `tick` as props, with an IntersectionObserver one shot draw and a reduced motion guard. Then the hero: eyebrow, H1, rule, sub, the single input with `parseDeadline` echo, button, micro line.

*Ships as: a hero worth looking at. Stop here and take a screenshot.*

**PHASE 4 · Sections 2 through 7 (2 days). AI can do this.**
§3 is the one to get right. Build it by feeding the fixture to `computeReviewInsights` and rendering the return value. Never paste the strings.

**PHASE 5 · The two showcase maps (half a day AI, half a day you).**
AI writes the dissertation chapter plan and thesis timeline structure into `showcase-maps.ts`. **You open every single URL by hand before it ships.** The page dares the reader to check the links. One dead link takes the whole trust structure with it, and this is the one thing that cannot be delegated to a model that has not clicked them.

**PHASE 6 · Founder note (30 minutes, you only).**
Your face, your words, the date. Nobody else can write this and it will read as copy if they do.

Total: roughly six working days, of which about one is yours and cannot be handed off.

---

## 8. THE FIRST WEEK

This is the part that actually breaks the paralysis. None of it requires the page to be finished.

### Monday morning, before you write a line of code

Do **not** post a launch announcement anywhere. r/PhD and r/GradSchool will remove it and you will have burned the account.

**1. One hour of reading, with your own eyes.** Open r/PhD and r/GradSchool, sort by new, and read the top of this week. You are looking for one thing: people writing some version of "I am so behind and I do not know what to do next." Everything in this document rests on that being the dominant register. The research behind it could not access Reddit directly, so this is the one unverified assumption and it costs you an hour to close. If the top of the week is not about being behind, tell me and I will revise. If it is, commit and stop looking back.

**2. Book five Focusmate sessions this week.** Focusmate is $8/month, has a free tier of three sessions a week, and runs a dedicated **PhD Focusmate Community**. These people have already opted into paying money and showing up on camera to a stranger because they cannot make themselves do this alone. They are pre-qualified on exactly the willingness you need.

At the end of each session, in the two minute debrief, ask **one** question:

> "Do you know if you're actually going to hit your submission date, or are you just hoping?"

Then shut up and write down what they say, word for word. **You need their language for the landing page more than you need their signup.** If four out of five say some version of "I have no idea", you have your positioning confirmed by humans rather than by a document.

### Tuesday

**3. Ten replies, zero links.** Back to r/PhD and r/GradSchool. Find ten people this week who wrote about being behind. Reply with something genuinely useful and no link. Then DM three of them: offer a free lifetime account in exchange for a twenty minute call. Expect one yes. One is enough to start.

**4. Start Phase 0.** The onboarding step. It is the highest leverage day of code available to you and it is independent of every design decision in this document.

### Wednesday

**5. Five emails to university writing centres.** Every one of these runs a funded dissertation boot camp with a named staff member and a public email address: Stanford CTL, Penn Graduate Student Center, UNC Writing Center, Princeton Writing Program, UCLA Graduate Writing Center, Harvard ARC, Michigan State, Duke, Syracuse, BU, Arizona.

Send exactly this question and nothing else:

> "You run a boot camp for two weeks. What happens to your students in week three?"

This is your B2B2C channel and it is the only one that scales without a budget. Princeton already charges a $50 motivational deposit that students forfeit if they do not finish, so an Ivy League university has literally priced accountability and built a forfeiture mechanic around it. These people believe in the problem already.

**6. Two emails to coaches.** Grad Coach (large YouTube channel, fifteen coaches, $120 to $130/hr) and The Dissertation Coach ($100 to $160/hr). **They are partners, not competitors.** They sell hours. They cannot bill for the six days between sessions. Solaspace is exactly the artefact a coach wants their client using between calls, and every one of them has a client list. Pitch it as that, not as a tool.

### The rest of the week

**7. Attend one Shut Up & Write session.** 100,000+ members, 60+ countries, runs online. Attend, do not pitch. You are there to hear how they talk.

**8. Build phases 1 to 4.**

Your first ten users come from conversations, not from traffic. Budget roughly one conversation per user for the first thirty. That is slow and it is the correct speed. Judge the week on **conversations started**, not on sessions or bounce rate, because narrowing to this audience means most of your current traffic will bounce and the site will feel like it died. That is the intent.

---

## 9. WHAT WE ARE NOT DOING, AND WHY

Keep this list. When one of these comes back at 1am, the answer is already written.

**Not pivoting to certification prep.** Becker, Kaplan Schweser and Cram Fighter all give the study planner away free with the content. Where nobody bundles one, the buyer is an engineer with a ChatGPT Pro subscription. This looks correct on paper and is a trap.

**Not submitting to the App Store yet.** A dissertation is written at a desk. Mobile is a check-in surface, not the work surface. The Capacitor shell is built and it will keep. Three weeks of App Review instead of twenty conversations with ABD candidates is the most expensive mistake currently available to you.

**Not building the four field hero calculator.** It was the most beautiful idea in the pile and its numbers do not compute. `lateDays = span × (f − p) / p` returns 200 to 350 days for any honest ABD persona, rendered at 7.5rem in coral. Days-until-a-date in the hero instead: arithmetic that cannot be wrong.

**Not adding streaks, badges, XP or counters.** Your own brand rule, and it is right for this audience. A person who has been avoiding chapter three for three weeks does not need a broken streak. Delete the one place it already leaked into the app.

**Not fabricating a single piece of proof.** No user counts, no ratings, no testimonials real or composite, no press logos, no "trusted by", no security badges, no "backed by", no waitlist numbers. The only numbers on the page are computed in front of the reader or checkable in the source. The current fake badge is the first thing you delete and nothing takes its place.

**Not chasing ADHD, endurance athletes, university students, career switchers or solo founders.** Tiimo won iPhone App of the Year and the category runs on the streak mechanic your brand rules forbid. Runna has 26,000 App Store reviews at 4.9 and is owned by Strava. Students are broke and have free GPT-5 Study Mode. The bootcamp market collapsed. The 2026 indie hacker stack is already Notion plus Claude plus ChatGPT. Every one of those is a fight you lose from a standing start.

**Not doing the cream background with a high contrast serif and a terracotta accent.** It is the confirmed 2026 template, and the design database you have locally codifies it with a do-not-use-for field that literally reads "tech startups, gaming, nightlife, corporate finance, high-energy brands." Your near-black plus warm gold clears roughly 9.9:1 and is 1 of about 6 in 192 palettes, and not one of those six uses a true near-black ground. **The palette was never the problem. Do not touch it.**

**Not fixing the card grids by turning them into a bento.** Bento is equally commodity now. The fix is fewer boxes, not differently shaped ones.

**Not marketing "Do it for me" drafts.** Keep the feature. Never pitch it to academics. Your entire edge with this audience is that you do not write it, you make sure they finish it.

---

## The honest risks, so you are not surprised by them

**The shame bet is the real one.** This page's emotional core is a gap between who you are and who you meant to be, aimed at a population with documented avoidance and 40 to 50% attrition. "You have not opened chapter three in seventeen days" can produce a closed tab. The mitigation is entirely in the voice: never accuse character, only a document and a date, and colour the gap `#6b5540` rather than red because red is blame. If the Focusmate conversations show people flinching, move the concession earlier and lead §3 with the on-track row.

**Churn is structural and unsolved.** A dissertation ends and so does the subscription. Twelve to eighteen months of customer life is good, not permanent. The same person then faces grant deadlines, a tenure clock and a book contract, and the academic channel resupplies every September, but plan and price for a finite customer, not a forever one.

**Most of your current traffic will bounce, and that is the intent.** Judge on conversations started.

**Newsreader adds a font download** while Sora is still loaded for the app. Subset to latin, restrict the axis range, and retire Sora app-wide in a later pass.

---

Six days of build. One hour of reading, five Focusmate sessions, ten replies, seven emails.

You are not stuck because you lack options. You are stuck because you have too many. This document removed eleven of them.

Start with the badge on line 191.