# Solaspace on the App Store: where this stands

Written 18 July 2026. Read this first. `BRIEF.md` next to it is the full technical
brief; `FINDINGS.md` is the raw evidence. This file is what changed, what works,
and what needs you.

---

## The payments decision (decided 20 July 2026)

**Paying web subscribers keep their Pro entitlement on iPhone. Only the purchase path is
hidden there.**

An earlier draft of this file (and `BRIEF.md` §5) read Guideline 3.1.3(b) as conditional
on also selling the same thing via in-app purchase, and so shipped the native build with
**free for everyone**. That reading has been reversed: 3.1.3(b) (multiplatform services)
is the clause that lets users *access* content, subscriptions, or features they acquired
on other platforms; what the iOS app must not do is offer or steer to a purchase outside
IAP. So:

- The native build resolves the user's **real plan** everywhere (`getSessionUser`,
  `guardAi`, `getPlan`) — a web Pro subscriber gets Pro limits and Pro features on iOS.
- Every price, every upgrade prompt, every "Pro" upsell, and every route to Stripe stays
  **gone** from the native build, exactly as before.
- The App Review notes (`APP_STORE.md`) state this 3.1.3(b) rationale explicitly.

StoreKit IAP remains an option for v1.1 if review pushes back, at 15% under Apple's Small
Business Program plus Stripe/StoreKit reconciliation work.

---

## What is done and verified

| | |
|---|---|
| Production build | **passes** (`npm run build`, all routes) |
| Typecheck | clean |
| Tests | **75 passing**, 5 of them new |
| Lint | clean on every touched file |
| Web appearance | **unchanged**, verified in-browser |
| iOS project | scaffolded, 10 plugins registered, icons and splash generated |
| iOS **compile** | **not verified**, see below |

### The native detection

The shell appends `SolaspaceApp/1.0` to the User-Agent. The server reads it and decides
everything from there, so nothing web-only ever paints for even a frame.

- `lib/native-ua.ts` holds the matching rule, environment free so client code and tests share it
- `lib/native.ts` composes it with the request headers (server only)
- `SessionUser.native` carries it through the app

Verified working against the dev server:

```
/   native UA -> 307 /app/today      (kills every pricing surface at once)
/   normal UA -> 200 landing page    (unchanged)
```

`native` is deliberately kept separate from `plan`. `plan` is the user's real plan on
every platform (3.1.3(b): web purchases are honoured on iOS); `native` is what keeps the
upgrade prompts, prices, and billing routes hidden in the build that must never show them.

### Guideline 3.1.1 surfaces closed

Landing page, `/app/billing`, the Sidebar upgrade card, Settings "Manage plan", the AskSola
limit nudge, the goal-cap copy, `guardAi()` responses, and both Stripe API routes now
return 403 to a native client. An audit also caught **`UpgradeModal`**, which printed the
real price and launched Stripe checkout, and was not on the original list. That one alone
would have been a certain rejection.

### Native-shell readiness in the web app

- `components/ui/ExternalLink.tsx`: `target="_blank"` is a **silent no-op** in a WKWebView.
  Nothing happens at all. Two of the eight occurrences were the tap-a-step-to-see-the-research
  moment, so the app's best feature would have looked broken. All 8 links and both `mailto:`
  links now open an in-app browser natively and behave exactly as before on the web.
- Safe areas on TopBar and Sidebar; BottomNav already had them.
- `html` now paints the canvas colour with `overscroll-behavior: none`, so rubber-banding
  cannot reveal the white scroll-view backdrop underneath. That is the most recognisable
  "this is just a website" tell there is.
- `.is-native` CSS kills long-press callouts and text selection, but re-enables selection
  inside inputs, without which typing a goal becomes impossible.
- The one `alert()` became a toast. System dialogs are titled with the origin and shout "web page".
- `components/kairo/NativeBridge.tsx` hides the splash, sets the status bar, handles the
  Android back button, and swaps to the offline screen when the connection drops. Every
  plugin is loaded with a guarded dynamic import so a missing one degrades instead of
  white-screening an app whose UI arrives over the network.
- `mobile/www/offline.html`, the only file inside the binary, is a self-contained branded
  offline screen that polls `/api/health` and returns automatically.

### A real bug found on the way

`/api/health` had **no CORS header**. The offline screen runs from the `capacitor://`
origin, so its fetch would have been blocked and "Try again" could never have succeeded.
The endpoint now sends `Access-Control-Allow-Origin: *`; it returns only a status string,
so there is nothing there worth protecting.

---

## What needs you

Nothing below was done, because all of it involves your Apple account or your money.

1. **Apple Developer Program**, 99 USD a year. Everything downstream needs it.
2. **Register the bundle ID** `app.solaspace.mobile`, create the App Store Connect record,
   install the signing certificate.
3. **The auth acceptance test, and treat this as unproven until it passes.** Clerk's session
   handshake is a top-level redirect, and Capacitor decides navigation by host. Clerk being
   on `clerk.solaspace.app` (a subdomain of the app's own domain) is what makes this
   survivable, and `allowNavigation` is configured for it. But it must be tested on a
   **TestFlight build on a real device** because the simulator does not reproduce it:
   sign in, force-quit, relaunch, background, leave overnight, relaunch. **If Safari ever
   opens, stop.** That needs a native navigation-delegate rule, which is a decision, not a tweak.
4. ~~Decide the payments question~~ — decided 20 July 2026, see the top of this file:
   web entitlements are honoured on iOS; only the purchase path is hidden.
5. **Fix the live pricing inconsistency**, unrelated to the app but a reviewer will see it:
   `lib/config.ts` says the monthly price is **10**, `app/terms/page.tsx` says **12**.

---

## Honest risks

**Guideline 4.2, minimum functionality, is the real one.** Apple rejects apps that are a
website in a wrapper. Push notifications are *not* the differentiator people assume, because
iOS home-screen web apps have sent push since 16.4 and this repo already ships a standalone
PWA manifest on the very domain the shell points at. A reviewer can hold up your own website
and ask what the app adds.

The answers that actually count are a **Home Screen widget** showing today's next focus
block, **Face ID app lock**, and **local notifications**. None are built yet; they are the
next work. Budget for two rejection cycles.

**`server.url` is documented by Capacitor as not intended for production.** They have never
published a rationale. Given 19 API routes, server actions, and Clerk middleware, a static
export is impossible, so this is the only route. Be aware we are outside the supported path.

**Not started yet:** the widget, Face ID, local notifications, Android (needs a JDK upgrade,
you are on Java 8 and it needs 17+), and the App Store listing copy.

---

## Running it: your first step

**Open the project in Xcode once before anything else.**

```bash
npx cap open ios
```

I could not verify that the iOS project compiles. `xcodebuild` hangs at
`Resolve Package Graph` indefinitely, tried twice, with and without a sandbox, over ten
minutes each, producing no further output and no error. Network is fine and the license is
accepted, so the most likely cause is that Xcode 26.6 has not completed its interactive
first-run setup on this machine, which a headless `xcodebuild` cannot do for itself.

Opening the project in Xcode should let it finish first-run, resolve the Swift packages
interactively, and build. **Until that happens, treat "the iOS app compiles" as unproven.**
Everything upstream of it is verified: `npx cap sync ios` completes cleanly, all 10 plugins
are registered, and the icons and splash screens are generated into the asset catalog.

Afterwards:

```bash
npx cap sync ios                     # after any config or plugin change
CAP_LIVE_RELOAD=1 npx cap sync ios   # point the shell at localhost:3000 instead
```

Capacitor 8 uses **Swift Package Manager**, not CocoaPods, so no `pod install` and no
Homebrew is needed. An earlier note in `FINDINGS.md` said otherwise; this supersedes it.

`ios/`, `android/` and `mobile/` are in `.vercelignore`, so none of this reaches the web deploy.

---

## Two things I changed that are not about the app

- **`tsconfig.json` now excludes `portfolio/`.** That nested project has its own git repo and
  its own tsconfig, and it was breaking the root `npm run build`. `everdeck` was already
  excluded for the same reason; this just matches the precedent.
- **`app/devpreview/mainframe-hero/` is broken** and fails the local build: it imports
  `./MainframeHero` and `./mainframe-hero.css`, neither of which exists. It belongs to
  another session so I left it alone. It is gitignored, so **Vercel is unaffected**, but no
  one can run `npm run build` locally until it is fixed or removed. I also deleted a stale,
  unused `.next-preview` build cache from 15 July that was breaking typecheck; it regenerates
  with `npm run dev:preview`.
