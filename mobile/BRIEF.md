# SOLASPACE NATIVE SHELL — BUILD BRIEF

**Date:** 2026-07-18 · **Repo:** `/Users/zander/Documents/KairoApp` · **Target:** iOS App Store first, Google Play later

---

## 1. VERDICT

**Viable, but three things in the earlier plan do not hold up and are corrected here.** (a) The "hide the upgrade UI but let web-Pro users keep Pro on iOS" plan is a straight 3.1.1 rejection — Apple rejects *consumption* of externally-purchased entitlements, not just their sale. The iOS build must serve the **free tier to every user, unconditionally**. (b) The "push notifications prove we're not a website" argument is dead — iOS home-screen web apps have sent push since iOS 16.4 and this repo already ships a standalone PWA manifest at `app/manifest.ts`, so a reviewer has a strong negative answer available; the native layer must include a **WidgetKit widget and Face ID lock**, shipped in v1, not held back. (c) Clerk session persistence in WKWebView has a documented production-only failure (the handshake 307 is a top-level redirect to a *different host*, which Capacitor punts to Safari) — the fix is **Clerk proxy mode**, which makes the Frontend API same-origin so the redirect can never leave the webview.

**What we are building:** a Capacitor 8 shell at the repo root, pointed at `https://solaspace.app/app/today` via `server.url`, with email-code-only Clerk auth on a new production instance in proxy mode, a native offline screen, on-device local notifications, a Home Screen + Lock Screen widget, Face ID app lock, haptics, native share, and a native-aware server layer that renders the free tier for every native request.

---

## 2. ARCHITECTURE

### 2.1 Shell → app
Capacitor 8 at the repo root. `server.url = https://solaspace.app/app/today`. No bundled Next build, no static export. `webDir = mobile/www` holds exactly one file (`offline.html`) plus its inline assets — it is the error/offline surface, nothing else. `ios/` and `android/` are committed to git and added to `.vercelignore`.

**Native detection is server-side, via User-Agent.** `appendUserAgent: "SolaspaceApp/1.0"` in the Capacitor config; the Next app reads it from the request header in RSC. This is load-bearing — it means every gating decision happens on the server with no flash of a web-only CTA, which suits a codebase where only 47 of 88 components are client components.

```ts
// lib/native.ts  (new)
import "server-only";
import { headers } from "next/headers";
export async function isNativeRequest(): Promise<boolean> {
  return ((await headers()).get("user-agent") ?? "").includes("SolaspaceApp/");
}
```

`SessionUser` gains `native: boolean`. **Do not conflate `plan` and `native`** — this is a trap: setting `plan: "free"` natively would *turn on* the Sidebar upgrade card (`components/layout/Sidebar.tsx:85`, gated on `user.plan === "free"`). Both flags are needed.

### 2.2 Auth
**New Clerk production instance (`pk_live`), running in proxy mode at `https://solaspace.app/__clerk`. Email code + password only — no social providers enabled on the production instance for v1.**

Rationale, decided: not enabling Google removes the `disallowed_useragent` webview block, removes the sign-in-token ticket bridge (an undocumented integration we would own and Clerk would not support), and removes Guideline 4.8 exposure entirely. Clerk users do not migrate from a dev instance to a production instance anyway, so there is no existing-user cost. Social login returns in v1.1 behind a `@capacitor/browser` + `signInTokens.createSignInToken({ expiresInSeconds: 60 })` bridge, once the app is already approved.

Proxy mode over the `clerk.solaspace.app` CNAME is the single highest-leverage decision in this document. Clerk's handshake — which fires precisely on session-token expiry, i.e. after backgrounding or relaunch — is a top-level 307 to the Frontend API host. Capacitor's navigation policy is **host-based**, so a CNAME on a different host is exactly the shape that gets ejected to Safari. Proxy mode makes FAPI same-origin; the redirect stays inside the webview. `proxy.ts:20,46` already exempts `/__clerk` from the site gate and includes it in the matcher — the plumbing is half-built.

Implementation: a catch-all Route Handler at `app/__clerk/[[...path]]/route.ts` forwarding to Clerk's FAPI with `Clerk-Proxy-Url`, `Clerk-Secret-Key` and `X-Forwarded-For`, plus `NEXT_PUBLIC_CLERK_PROXY_URL`. **Read https://clerk.com/docs/guides/development/deployment/proxy for the exact upstream host and header set — do not guess it.** Must pass through all methods, streaming bodies, and `Set-Cookie` unmodified.

**Migration hazard nobody has flagged yet:** `lib/supabase/scoped.ts:30-35` hands Supabase the Clerk session token, and Supabase validates it against Clerk's JWKS as a configured third-party auth provider. Changing Clerk instance changes the issuer. **The Supabase third-party auth provider config must be updated to the new Clerk domain in the same change, or every RLS-scoped query breaks silently.** Existing `users_profile.clerk_user_id` rows from the dev instance are orphaned — dev-instance user IDs do not exist in production.

`<SignIn routing="hash" />` (`app/sign-in/page.tsx:14`) stays as-is. Hash routing is correct for a webview.

### 2.3 Payments — tier-identical iOS
The native build resolves **free** for everyone, at two chokepoints:

- `lib/auth/index.ts` `getSessionUser()` — `plan: native ? "free" : (profile?.plan ?? "free")`
- `lib/ai/guard.ts` `guardAi()` — `const plan = native ? "free" : await planFor(userId, supabase)`

That is the entitlement change. Separately, every purchase *surface* is removed natively (section 5). Both are required; neither alone is sufficient.

### 2.4 External links
Eight `target="_blank"` anchors are **silent no-ops in WKWebView** — no error, no navigation. Two of them (`GalaxyMap.tsx:2107`, `:2124`) are the core product promise. One shared `<ExternalLink>` component calls `Browser.open({ url, presentationStyle: "popover", toolbarColor: "#0a0b0d" })` when native, falls back to a normal anchor on web. Same treatment for the two `mailto:` links.

### 2.5 Notifications — local, on-device, for v1
**Decision: v1 ships `@capacitor/local-notifications`, not APNs push.** Reasons: it removes an owner blocker (APNs `.p8` key generation), it is timezone-correct by construction (the repo has **no `timezone` column** and the cron is a single daily `0 14 * * *` in `vercel.json`), it works offline, and it is still a capability iOS web apps do not have. Two notification types:

1. A repeating daily reminder at a user-chosen hour → deep-links to `/app/today`.
2. Focus-block start/end reminders, scheduled from the webview when a day plan is built — the app knows these locally.

APNs push moves to v1.1 (section 6). The schema and sender design from the research pass are sound and should be built then: `push_devices` table, `apns_jwt_cache`, `node:http2` + `jose` ES256, hourly cron gated on a per-user `timezone` column.

### 2.6 Offline
No service worker exists in this repo, and **do not add one** — it would create stale-cache-vs-server-render conflicts for zero benefit here. Native handling only:

1. `SplashScreen.launchAutoHide: false` — the splash *is* the loading state, held until the first authenticated screen mounts.
2. On launch, `Network.getStatus()`; if disconnected, load `offline.html` immediately rather than waiting out Capacitor's documented ~2-minute white-screen stall.
3. `server.errorPath: "offline.html"` as the backstop for server-up-but-erroring.
4. `offline.html` is fully self-contained (inline CSS, inline SVG mark, `#0a0b0d`, gold accent, Retry button) and polls **`/api/health`** — which already exists at `app/api/health/route.ts` — with `fetch(..., {method:"HEAD"})`. **Do not use the Network plugin inside `offline.html`**: the Android error page has no bridge access.

---

## 3. BUILD ORDER

Each phase ends at a stated, checkable outcome. `[AGENT]` = do now, autonomously. `[OWNER]` = must not be done by the agent under any circumstances.

**Phase 0 — Preflight `[AGENT]`**
`xcodebuild -version` (must be ≥ 26.0 — Apple rejects all App Store Connect uploads not built with Xcode 26 / iOS 26 SDK since 28 Apr 2026), `node -v` (≥ 22), `npm view @capacitor/core version`.
→ *Checkpoint: versions recorded; if Xcode < 26, stop and escalate.*

**Phase 1 — Web-side native readiness `[AGENT]`** — no Capacitor yet, ships to web safely
`lib/native.ts`, `SessionUser.native`, safe-area fixes, `html` background + `overscroll-behavior`, `<ExternalLink>` at all 8 sites + 2 mailto, `alert()` → toast, share-link hardening, sign-out/delete redirects.
→ *Checkpoint: `npm run typecheck && npm run build && npm run test` pass; web behaviour visually unchanged in the browser.*

**Phase 2 — Tier-identical gating `[AGENT]`**
The two entitlement chokepoints plus every surface in section 5.
→ *Checkpoint: with `curl -H "User-Agent: SolaspaceApp/1.0"` against a Vercel preview, `/app/billing` 307s to `/app/settings`, `/` 307s to `/app/today`, and no page returns the string "Pro", "Upgrade", or a price.* Write this as a vitest test.

**Phase 3 — Clerk production + proxy `[OWNER + AGENT]`**
`[OWNER]` Create the production instance in the Clerk dashboard, complete whatever DNS records it requires to activate, do **not** enable any social connection, set `pk_live`/`sk_live` in Vercel, and update the Supabase third-party auth provider to the new Clerk domain.
`[AGENT]` Write `app/__clerk/[[...path]]/route.ts` and set `NEXT_PUBLIC_CLERK_PROXY_URL`.
→ *Checkpoint: sign up, sign in, sign out, and a full goal-map create all work on a Vercel preview in a desktop browser, with all Clerk network traffic going to `solaspace.app/__clerk`. **Nothing downstream is testable until this passes.***

**Phase 4 — Capacitor scaffold `[AGENT]`**
Install, `cap init`, `cap add ios`, `capacitor.config.ts`, `mobile/www/offline.html`, `.vercelignore`.
→ *Checkpoint: `npx cap sync ios` clean; app builds and launches in the iOS Simulator and loads solaspace.app.*

**Phase 5 — THE AUTH ACCEPTANCE TEST `[OWNER for account, AGENT for build]`**
`[OWNER]` Enrol in the Apple Developer Program, register bundle ID `app.solaspace.mobile`, create the App Store Connect record, install the signing certificate, and push the build to TestFlight.
`[AGENT]` Prepare the archive; never touch signing or App Store Connect.
**Test on a TestFlight build on a physical device — the simulator and Xcode dev builds do not reproduce this failure:** sign in → force-quit → relaunch → wait past session expiry (~1 min) → background/foreground → leave overnight → relaunch.
→ *Checkpoint: the user is still signed in and Safari never opens. **If Safari opens, stop and escalate — the architecture needs a native `WKNavigationDelegate` rule and that is a decision point, not a config tweak.***

**Phase 6 — Native layer `[AGENT]`**
Splash/system bars/safe areas, offline pre-flight, `.is-native` CSS, Android back button, haptics on focus-block completion and node→Done, native share sheet for the goal map, Face ID app lock, local notifications + the custom in-app pre-prompt.
→ *Checkpoint: airplane mode shows the branded offline screen (never iOS's "Cannot Open Page"); Face ID gates cold launch; a scheduled local notification arrives and deep-links to `/app/today`.*

**Phase 7 — WidgetKit widget `[AGENT]`**
`.systemSmall` + `.accessoryRectangular` showing today's next focus block. Data path: `@capacitor/preferences` configured with the iOS `group` option → App Group `group.app.solaspace.mobile` → widget reads `UserDefaults(suiteName:)`. The web app writes the next move on every `/app/today` render. *Verify the `group` option exists on the installed Preferences version; if not, a ~20-line custom plugin writing to the shared suite does the same job.* Add an App Intent reading the same App Group data ("what's my next move") — near-free once the widget exists, and it puts the app in Siri and Spotlight.
→ *Checkpoint: widget renders real data on the Home Screen and Lock Screen; screenshot it for the review notes.*

**Phase 8 — Assets, metadata, submission `[AGENT prepares, OWNER submits]`**
`[AGENT]` Generate icons/splash from the mark, draft the listing copy and App Review notes, author `PrivacyInfo.xcprivacy`.
`[OWNER]` Upload, answer the App Privacy questionnaire, and submit. **The agent submits nothing.**

**Owner-only, never the agent:** Apple Developer Program enrolment and any payment · Apple ID sign-in · signing certificates and provisioning profiles · bundle ID registration · App Store Connect record creation, metadata upload, or submission · Clerk dashboard account changes and DNS · APNs key generation (v1.1) · any Vercel env var that is a live secret.

---

## 4. EXACT COMMANDS AND FILES

### 4.1 Install
Run `npm view <pkg> version` first — the versions below were verified July 2026 but pin to whatever is current in the 8.x line.

```bash
npm install \
  @capacitor/core@^8.4.2 \
  @capacitor/app@^8.1.1 \
  @capacitor/browser@^8.0.4 \
  @capacitor/haptics@^8.0.2 \
  @capacitor/local-notifications@^8 \
  @capacitor/network@^8.0.1 \
  @capacitor/preferences@^8.0.1 \
  @capacitor/share@^8 \
  @capacitor/splash-screen@^8.0.2 \
  @aparajita/capacitor-biometric-auth@latest

npm install -D @capacitor/cli@^8.4.2 @capacitor/assets@^3.0.5

npx cap init Solaspace app.solaspace.mobile --web-dir=mobile/www
npm install @capacitor/ios@^8.4.2
npx cap add ios
npx cap sync ios
```

Android is deferred; add `@capacitor/android` in a later pass — the entire web and server layer is already platform-agnostic.

### 4.2 `capacitor.config.ts` (repo root)

```ts
import type { CapacitorConfig } from "@capacitor/cli";

// Live-reload is env-gated so a localhost URL can never ship to the store.
const dev = process.env.CAP_LIVE_RELOAD === "1";

const config: CapacitorConfig = {
  appId: "app.solaspace.mobile",
  appName: "Solaspace",
  webDir: "mobile/www",            // ONLY offline.html lives here
  appendUserAgent: "SolaspaceApp/1.0",  // load-bearing: server-side native detection

  server: {
    url: dev ? "http://localhost:3000" : "https://solaspace.app/app/today",
    cleartext: dev,                // NEVER true in a shipped build
    androidScheme: "https",        // do not change: clears cookies/localStorage
    allowNavigation: ["solaspace.app", "*.solaspace.app"],
    errorPath: "offline.html",
  },

  ios: {
    contentInset: "never",
    scrollEnabled: true,
    limitsNavigationsToAppBoundDomains: false,  // MUST stay false; see note
    backgroundColor: "#0a0b0d",
    webContentsDebuggingEnabled: dev,           // off for the submitted build
    zoomEnabled: false,
  },

  plugins: {
    SplashScreen: { launchAutoHide: false, backgroundColor: "#0a0b0dff", showSpinner: false },
    SystemBars: { insetsHandling: "css" },
    Preferences: { group: "group.app.solaspace.mobile" },  // shared with the widget
    LocalNotifications: { iconColor: "#e6b877" },
  },
};

export default config;
```

Notes: `server.hostname` is deliberately omitted — it configures the *local* device hostname and is meaningless with a remote `server.url`. `iosScheme` stays at its default; `offline.html` is stateless so its origin does not matter. `limitsNavigationsToAppBoundDomains` must stay `false` — enabling it caps you at 10 domains and hard-blocks navigation outside them, which breaks every cited resource link. Verify `ios.zoomEnabled` exists in Capacitor 8; if not, set `maximumZoomScale = 1` on the webview's scroll view in `AppDelegate`. **No ATS exceptions** — Vercel's TLS satisfies ATS out of the box; confirm with `nscurl --ats-diagnostics https://solaspace.app`.

### 4.3 Files to CREATE

| Path | Purpose |
|---|---|
| `capacitor.config.ts` | above |
| `mobile/www/offline.html` | self-contained branded offline screen, polls `/api/health` |
| `lib/native.ts` | `isNativeRequest()` |
| `components/ui/ExternalLink.tsx` | `Browser.open()` when native, anchor on web |
| `components/kairo/NativeBridge.tsx` | client component mounted once in the authed layout: splash hide, back button, network listener, plugin feature-detection |
| `components/kairo/NotificationOptIn.tsx` | custom pre-prompt, fired after the first day plan is built — **never on launch** |
| `app/__clerk/[[...path]]/route.ts` | Clerk FAPI proxy |
| `.vercelignore` | `ios/`, `android/`, `mobile/` |
| `ios/App/App/PrivacyInfo.xcprivacy` | `NSPrivacyTracking: false`, empty tracking domains, `NSPrivacyAccessedAPICategoryUserDefaults` reason `CA92.1` |
| `ios/SolaspaceWidget/*` | WidgetKit extension (Phase 7) |

### 4.4 Files to MODIFY

| Path | Change |
|---|---|
| `lib/auth/index.ts` | `SessionUser.native`; `plan: native ? "free" : profile.plan` |
| `lib/ai/guard.ts` | native → force `plan = "free"`; strip `upgrade: true` and all "Pro" copy from 402/429 bodies |
| `lib/data/actions.ts:35-44` | goal-cap error: neutral copy + `upgrade: false` when native |
| `components/layout/TopBar.tsx:10` | `py-3` → `pt-[calc(12px+env(safe-area-inset-top))] pb-3` |
| `components/layout/Sidebar.tsx:24` | add `pt-[max(24px,env(safe-area-inset-top))] pb-[max(24px,env(safe-area-inset-bottom))] pl-[max(16px,env(safe-area-inset-left))]` |
| `components/layout/Sidebar.tsx:85-89` | upgrade card: `&& !user.native` |
| `components/kairo/GoalList.tsx:23` | re-verify the `72px` TopBar offset once TopBar is safe-area-aware — it currently over-compensates while TopBar under-compensates |
| `app/globals.css:219,221` | `html { background-color: var(--color-canvas); }` and `html, body { overscroll-behavior: none; }` — without this, rubber-banding reveals the white UIScrollView backdrop, the single most recognisable "this is a website" tell |
| `app/app/billing/page.tsx` | native → `redirect("/app/settings")` |
| `app/page.tsx` | native → `redirect("/app/today")` (kills all pricing exposure in one guard) |
| `components/kairo/SettingsForm.tsx:33,63` | delete-account redirect `/` → `/sign-in`; hide the "Manage plan" link when native |
| `components/kairo/SettingsForm.tsx` (SignOutButton) | `redirectUrl="/"` → `/sign-in` when native |
| `components/kairo/AskSola.tsx:78,126-127` | `alert()` → `showToast`; hide the upgrade nudge when native |
| `components/kairo/GalaxyMap.tsx:1012` | build the share URL from `SITE_URL`, not `window.location.origin` |
| `app/api/stripe/checkout/route.ts`, `portal/route.ts` | 403 on native UA (defense in depth) |
| `next.config.ts` | comment: adding a CSP header can break Capacitor's injected bridge |
| `.env.local` / Vercel | `NEXT_PUBLIC_CLERK_PROXY_URL`, `pk_live`/`sk_live` |

Plus `<ExternalLink>` swapped in at `GalaxyMap.tsx:2107,2124,2349` · `Markdown.tsx:40` · `GoalList.tsx:104` · `SharedGoalView.tsx:99` · `ShowcaseTree.tsx:309,325`, and `app/privacy/page.tsx:54` + `app/terms/page.tsx:87` for mailto.

### 4.5 `.is-native` CSS (gate on `Capacitor.isNativePlatform()`)
```css
.is-native { -webkit-touch-callout: none; -webkit-user-select: none; user-select: none;
             -webkit-tap-highlight-color: transparent; }
/* MANDATORY — without this, goal entry becomes unusable */
.is-native input, .is-native textarea, .is-native [contenteditable] {
             -webkit-user-select: text; user-select: text; }
```
All inputs must be ≥16px font-size to prevent iOS focus zoom.

### 4.6 Xcode capability toggles (Phase 5–7, `[OWNER]` for signing)
- **App Groups** → `group.app.solaspace.mobile` on both the app target and the widget extension (Phase 7).
- **Face ID** → no capability needed; add `NSFaceIDUsageDescription` to `Info.plist`.
- **Push Notifications** → **not in v1.** Do not enable it, and do not add the Remote Notifications background mode — an unused background mode invites review questions.
- Turn `webContentsDebuggingEnabled` off before archiving.

### 4.7 Assets
```bash
npx @capacitor/assets generate \
  --iconBackgroundColor '#0a0b0d' --iconBackgroundColorDark '#0a0b0d' \
  --splashBackgroundColor '#0a0b0d' --splashBackgroundColorDark '#0a0b0d'
```
Needs real rasters from `public/kairo-mark.svg`: `assets/icon-only.png` (1024², **opaque, no alpha, no rounded corners** — iOS applies the mask), `assets/icon-foreground.png` + `icon-background.png` (1024², mark within the centre ~66%), `assets/splash.png` + `splash-dark.png` (2732², mark within the centre ~1200px). `app/manifest.ts` only ships the SVG today; native needs the PNGs.

---

## 5. THE 3.1.1 PAYMENTS DECISION

> **Superseded 20 July 2026** — see `HANDOVER.md`. The shipped behaviour honours web-bought
> entitlements on iOS under 3.1.3(b) (multiplatform services) and hides only the purchase
> path. The "must NOT appear" list below still stands in full; the free-tier-for-everyone
> paragraphs do not.

**The iOS app grants the free tier to every user, regardless of what they pay on the web.**

Not "hides the buy button." The earlier plan — hide the purchase UI, honour the web entitlement — is the specific thing Apple rejects, and the standard rejection text says so: *"Your app accesses digital content purchased outside the app, and that content is not available through in-app purchase."* Guideline 3.1.3(b) is the only clause that would let a web purchase light up on iOS, and it is conditional: content acquired elsewhere may be accessed *"provided those items are also available as in-app purchases within the app."* No IAP, no cover. 3.1.3(f) does not rescue us — Solaspace is freemium and is itself the product, not a free companion to a paid web tool, and an AI planner is nowhere in its enumerated list (VoIP, cloud storage, email, web hosting).

**Must NOT appear anywhere in the native build:** the word "Pro" as a purchasable thing · any price, any currency figure · `/app/billing` · `BillingPlans` · `UpgradeModal` · the Sidebar upgrade card · the Settings "Manage plan" link · the AskSola limit nudge · the goal-cap "upgrade to Pro for unlimited" copy · any link or button leading to Stripe or to solaspace.app pricing. Gated features are simply **absent**, never locked-with-a-price. A tappable link to a web checkout is itself a violation, so "manage your plan at solaspace.app" gets no link and, in our design, no page — `/app/billing` redirects to `/app/settings`.

**What it costs us.** A paying web subscriber gets the 2-goal free tier on their iPhone. That is a genuine product and support problem and the owner should decide how to communicate it (section 6). The alternative — shipping StoreKit IAP in v1 — costs 15% (Small Business Program, under $1M) plus real reconciliation work between Stripe and StoreKit into `users_profile.subscription_status`, and delays submission. **We take the tier-identical path for v1 and plan StoreKit for v1.1**, at which point 3.1.3(b) opens properly and web-purchased Pro may legally light up on iOS.

The US anti-steering carve-out does not help. 3.1.1(a) is written as apps that *"may offer in-app purchases **and also** use a link"* — it lifts the ban on steering, it does not lift the IAP obligation, it is US-storefront only, and SCOTUS granted cert on 30 June 2026 with argument in OT2026, so the position could move. Do not build a business model on it.

**Listing metadata, non-negotiable:** never the words "website", "web app", "browser", "portal", or the bare domain, in the name, subtitle, description, keywords, or screenshots. No browser chrome in any screenshot. Describe the AI as a **planner**, never a "chatbot" or "chat assistant" — that invites a 4.7 misclassification with content-filtering obligations attached. Include a native-features line (2.5.1 asks you to indicate framework integration in the description). Use the App Review Notes to state that you are the content owner shipping a custom binary (pre-empts 4.2.6), enumerate the widget / Face ID / local notifications / offline mode and where to find each, confirm there are no in-app purchases, and supply a seeded demo account with real goals — a reviewer who lands on an empty state concludes it's a web clipping. **Do not mention `server.url` or argue that push differentiates us from Safari** — the first draws attention to an unblessed pattern, the second reads as a developer who hasn't done their homework.

---

## 6. RISKS AND OPEN QUESTIONS

### Could still get us rejected
1. **4.2 Minimum Functionality — the primary risk, and higher than earlier estimates.** A developer on Apple's own forums (thread 806726, Nov 2025) was rejected **ten times** under 4.2 with a *native* main screen, native menus, push, and camera — strictly more native surface than our plan. Our PWA-parity exposure is unusually bad because `app/manifest.ts` already delivers standalone chrome and a home-screen icon on the exact domain the shell points at. The widget, Face ID, and App Intent are the answer; **budget for two rejection cycles**, with a focus-block Live Activity as the second response.
2. **4.3(b), tightened 9 June 2026** — apps "indistinguishable from what's already widely available," with removal from the Developer Program for repeat offenders. AI goal planners are a saturated 2026 category. Solaspace is genuinely differentiated (a researched resource attached to every node), and the metadata must lead with that mechanic, not with "AI planner."
3. **2.1 App Completeness** — reviewers test on bad networks. The offline screen is not polish; it is the mitigation.
4. **3.1.1** — a reviewer who signs in with a Pro-flagged account and sees Pro behaviour invokes it. Tier-identical is what closes this; verify it with the Phase 2 UA test.
5. **Clerk session persistence** — treat as **unverified** until the Phase 5 TestFlight test passes. Do not let anyone call this resolved on the basis of the Ionic forum thread; that thread is an open, unanswered bug report whose only reply is the untested suggestion this brief is deliberately going beyond.
6. **`server.url` is documented as "not intended for use in production"** and Capacitor has never given a technical rationale. Every affirmative production report in the tracker is from 2021–2022. We are outside the supported path with no vendor support.

### Owner decisions on return
1. **Paying web subscribers get the free tier on iOS.** Accept and communicate, or fund StoreKit IAP in v1.1? Recommendation: accept for v1, ship IAP in v1.1.
2. **Vercel plan tier** — the hourly cron that APNs push needs may not be available on Hobby. Not blocking for v1 (local notifications need no cron), but it decides the v1.1 push design.
3. **iPad.** If we don't submit iPhone-only, Apple will test iPad, where the Sidebar is the only chrome (both TopBar and BottomNav are `md:hidden`). Recommendation: **submit iPhone-only for v1** and fix the Sidebar insets anyway.
4. **Dictation.** WKWebView has no Web Speech API, so the mic button silently disappears natively — it's feature-detected at `lib/hooks/use-speech-input.ts:29-30` and gated at three call sites, so it degrades cleanly. Restore via `@capacitor-community/speech-recognition` behind the same hook, or accept the regression?
5. **Live pricing inconsistency, unrelated to the shell but visible to reviewers:** `app/terms/page.tsx:40` says **$12/month**, `lib/config.ts` says **$10**. Fix before submission.
6. **Social login.** Not enabled on the production instance for v1 by design. Add Google (plus Sign in with Apple, which Guideline 4.8 then makes mandatory) in v1.1 behind the `@capacitor/browser` + sign-in-token bridge, with `expiresInSeconds: 60` and a universal link rather than a custom scheme.