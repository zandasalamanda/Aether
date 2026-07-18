# App Store listing and review notes (draft)

Copy is ready to paste. Anything in `[SQUARE BRACKETS]` needs you.

Three rules run through all of it, each tied to a specific rejection:

1. **Never the words "website", "web app", "browser", "portal", or the bare domain**, in the
   name, subtitle, description, keywords, or any screenshot. No browser chrome visible in a
   screenshot either. This is Guideline 4.2, minimum functionality.
2. **Call it a planner, never a chatbot or an AI assistant.** "Chat" wording invites a
   Guideline 4.7 misclassification, which drags content-filtering obligations along with it.
3. **Lead with the mechanic, not the category.** "AI goal planner" is a saturated 2026
   category and Guideline 4.3(b) was tightened in June 2026 against apps that look
   indistinguishable from what already exists. The thing no competitor does is attaching a
   real, named, checkable source to every single step. Lead with that.

---

## Name and subtitle

**Name:** `Solaspace`

**Subtitle** (30 char limit, so these are counted):

- `Map the way. Build the day.` (27) — the brand line, recommended
- `Every step, already researched` (30) — leads with the differentiator

## Promotional text (170 chars, editable without a new review)

```
Tell Solaspace a goal in plain words. It maps every step, attaches a real video or
article to each one, and builds your day around the time you actually have.
```

## Description

```
Solaspace turns a goal you have been putting off into a path you can actually walk.

Say what you want in plain words. Solaspace breaks it into milestones and steps in the
right order, and attaches a specific, named source to each one: a real video, a real
guide, from a publisher you have heard of. No searching, no blank page, no wondering
whether you are starting in the right place.

Then it builds your day. Tell Solaspace how much time you have and how much energy you
have, and it picks the steps that genuinely fit today and leaves the rest on the map.
Fall behind and nothing is lost. Push anything, and the plan rebuilds around where you
actually are.

WHAT MAKES IT DIFFERENT

Every step arrives already researched. Most planners hand you an empty checklist and
leave the hard part, working out what to actually do, entirely to you.

HOW IT WORKS

1. Say the goal the way you would say it out loud.
2. Watch it become a map of steps, each with a source attached.
3. Each morning, tell Solaspace your time and energy and start on what fits.
4. Review what moved, and rebuild whenever life gets in the way.

BUILT FOR IPHONE

[ONCE BUILT, LIST ONLY WHAT IS ACTUALLY SHIPPING:]
- A Home Screen and Lock Screen widget showing your next focus block
- Face ID to lock your plans
- Reminders that arrive at the times you choose
- Works offline

Solaspace is free to start. No account is needed to look around, and nothing is saved
until you make one.
```

> The "BUILT FOR IPHONE" block does double duty: Guideline 2.5.1 asks you to indicate
> framework integration in the description, and it is the paragraph a reviewer reads when
> deciding whether this is more than a repackaged site. **Do not list a feature before it
> ships.** Claiming a widget you have not built is a faster rejection than having no widget.

## Keywords (100 chars, comma separated, no spaces)

```
goal,plan,planner,steps,focus,productivity,habit,routine,daily,progress,research,study
```

Avoid: `web`, `browser`, `site`, `chat`, `chatbot`, `GPT`, `AI assistant`.

## Category

Primary **Productivity**. Secondary **Education**.

---

## App Review notes

Paste into App Store Connect > Version Information > Notes. Every paragraph is
pre-empting a specific rejection.

```
ABOUT THIS BUILD
Solaspace is our own product and this binary is built and submitted by us as the
content owner. It is not a template, a reseller build, or a repackaging of another
party's content.

DEMO ACCOUNT
Email: [DEMO EMAIL]
Password: [DEMO PASSWORD]
This account is seeded with goals and a day plan already in place, so the app is not
empty on first launch. Sign in from the first screen.

NATIVE FUNCTIONALITY, AND WHERE TO FIND IT
[LIST ONLY WHAT SHIPS. FOR EACH, SAY EXACTLY WHERE TO TAP:]
- Home Screen widget: long press the Home Screen, add the Solaspace widget, and it
  shows the next focus block from the signed in account.
- Face ID: Settings > Privacy > App Lock, then background and reopen the app.
- Reminders: Today > the reminder row, choose a time, and a notification is scheduled
  on the device.
- Offline: enable Airplane Mode and reopen the app to see the offline state.

IN-APP PURCHASES
There are none. This app contains no purchases, no subscriptions, no prices, and no
links to any external purchase flow. Every user of the iOS app receives the same
feature set.

PERMISSIONS
Notifications are requested only after the user has built their first day plan and
chosen a reminder time, never on launch. Face ID is requested only if the user turns
on App Lock.
```

**Do not write in the notes:** anything about the app loading content over the network,
anything naming the framework's remote-URL mode, and any argument that notifications make
this different from a mobile site. The first draws attention to an unblessed pattern. The
second is wrong on the facts (iOS home-screen web apps have sent push since 16.4) and
reads as a developer who has not done their homework.

---

## Screenshots

Required: 6.9" iPhone. Five or six frames.

1. The goal map for a real, ordinary goal. This is the product.
2. A step open, showing its attached source with the publisher name visible.
3. Today, with the time and energy controls and the resulting plan.
4. The widget on a real Home Screen. This is the single most useful frame for
   Guideline 4.2, so shoot it once the widget exists.
5. Review, showing progress.

Rules: no browser chrome, no URL bar, no cursor, no desktop window. Use real content, not
lorem ipsum, and not the aspirational sample goals. Ordinary goals read as trustworthy.

---

## App Privacy questionnaire

Answer against what the app really does. Current data flows:

| Data | Collected | Linked to user | Tracking | Purpose |
|---|---|---|---|---|
| Email address | yes | yes | no | account, via Clerk |
| Name | yes | yes | no | account |
| User content (goals, plans, notes) | yes | yes | no | app functionality |
| Usage / product analytics | yes, PostHog | [CONFIRM whether identified] | no | analytics |
| Crash data | [CONFIRM] | | no | diagnostics |

**Tracking is No** as long as nothing is shared with data brokers or used for cross-app
advertising. If that stays true, `PrivacyInfo.xcprivacy` sets `NSPrivacyTracking` false with
an empty tracked-domains list. Confirm PostHog is not configured for advertising IDs before
answering, because getting this wrong is a policy problem rather than a review note.

Age rating: **4+**. Nothing in the content warrants higher.

---

## Before you submit

- [ ] The pricing inconsistency is fixed: `lib/config.ts` says 10, `app/terms/page.tsx` says 12
- [ ] `webContentsDebuggingEnabled` is not enabled in the archived build
- [ ] The demo account exists, is seeded, and you have signed into it yourself
- [ ] Every native feature named in the description and notes actually ships
- [ ] No screenshot shows browser chrome
- [ ] The auth acceptance test in HANDOVER.md passed on a real device via TestFlight
- [ ] Submitting iPhone only for v1, so iPad layout is not reviewed
- [ ] Signed in as a Pro web subscriber and confirmed the iOS app shows no price and no
      Pro-only feature. A reviewer doing exactly this is the 3.1.1 risk.
