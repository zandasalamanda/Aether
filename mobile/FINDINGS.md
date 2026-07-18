# Native wrapper: established facts

Working notes from the investigation. Nothing here is a decision on its own;
the build brief (BRIEF.md) supersedes it.

## Why a bundled static build is impossible

The Next app cannot use `output: 'export'`:

- 19 API route handlers under `app/api`
- at least one `"use server"` server-actions file
- Clerk middleware at `proxy.ts` (Next 16 renamed `middleware.ts`)
- 88 components, only 47 of them client components, so most rendering is on the server

So the shell must load the deployed site over the network (Capacitor `server.url`),
not ship a static bundle inside the binary.

## Production site

| Check | Result |
|---|---|
| `https://solaspace.app/` | 200, ~0.77s |
| `/sign-in`, `/sign-up`, `/privacy` | 200 |
| `/app/today` logged out | 307 to sign-in, correct |
| `X-Frame-Options` / CSP frame rules | none, so nothing blocks a webview |
| HSTS | `max-age=63072000` |

## Clerk is on a custom domain (important)

Clerk's frontend API is served from **`clerk.solaspace.app`** (200), not `clerk.accounts.dev`.

This is the single most helpful fact for auth in a webview: Clerk's cookies share the
registrable domain `solaspace.app` with the app itself, so they are not third-party
cookies. That avoids the ITP / third-party-cookie blocking that usually breaks
session persistence inside WKWebView.

`clerk.solaspace.app` must be included in the Capacitor `server.allowNavigation` list.

## Local toolchain

| Tool | Status |
|---|---|
| Node | v22.23.1, fine for Capacitor 7 |
| npm | 10.9.8 |
| Xcode | 26.6 (full install at `/Applications/Xcode.app`) |
| CocoaPods | not installed, and **turned out not to be needed**, see below |
| Homebrew | not installed, also not needed |
| Java | 1.8, too old for a modern Android build (needs 17+) |
| `ANDROID_HOME` | unset, Android Studio likely absent |

**Correction, confirmed by actually running it:** Capacitor 8 uses **Swift Package Manager**,
not CocoaPods. `npx cap add ios` generated `ios/App/CapApp-SPM` and registered all 10 plugins
with no `pod install` step and no Homebrew. The earlier "owner must install CocoaPods" note
was wrong and there is nothing for the owner to install.

Android still needs a JDK upgrade (Java 8 is present, 17+ is required) and the SDK, so it is
deferred rather than blocked.
