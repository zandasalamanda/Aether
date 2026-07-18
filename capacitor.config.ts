import type { CapacitorConfig } from "@capacitor/cli";

// Native shell configuration.
//
// Solaspace renders almost entirely on the server (19 API routes, server
// actions, Clerk middleware), so a Next static export is impossible and the
// shell loads the deployed site over the network instead of bundling it.
// `webDir` therefore holds exactly one file, the offline screen, and nothing else.
//
// Live reload is env-gated rather than commented in and out, so a localhost URL
// can never reach a shipped build by accident.
const dev = process.env.CAP_LIVE_RELOAD === "1";

const config: CapacitorConfig = {
  appId: "app.solaspace.mobile",
  appName: "Solaspace",
  webDir: "mobile/www",

  // Load-bearing. The server reads this token from the User-Agent to decide
  // whether a request came from the app (lib/native.ts). Every App Store
  // entitlement and pricing decision keys off it, so if this string changes,
  // NATIVE_UA_TOKEN in lib/native.ts must change with it.
  appendUserAgent: "SolaspaceApp/1.0",

  server: {
    url: dev ? "http://localhost:3000" : "https://solaspace.app/app/today",
    cleartext: dev, // never true in a shipped build
    androidScheme: "https", // do not change: altering it clears cookies and localStorage
    // Hosts the webview may navigate to itself. The wildcard covers
    // clerk.solaspace.app, which matters because Clerk's session handshake is a
    // top-level redirect to its Frontend API host. If that host were not
    // allowed, Capacitor would eject the user into Safari mid-sign-in.
    // Everything else (cited articles, YouTube) is opened deliberately in an
    // in-app browser by components/ui/ExternalLink.tsx, not navigated to here.
    allowNavigation: ["solaspace.app", "*.solaspace.app"],
    errorPath: "offline.html",
  },

  ios: {
    contentInset: "never", // we handle insets in CSS with env(safe-area-inset-*)
    scrollEnabled: true,
    backgroundColor: "#0a0b0d", // matches --color-canvas so overscroll never flashes white
    zoomEnabled: false,
    allowsLinkPreview: false, // long-press previews read as a browser, not an app
  },

  plugins: {
    // The splash IS the loading state. Because the app is fetched over the
    // network, auto-hiding on webview-ready would reveal a blank screen while
    // the first render arrives. NativeBridge hides it once the app has painted.
    SplashScreen: { launchAutoHide: false, backgroundColor: "#0a0b0dff", showSpinner: false },
    LocalNotifications: { iconColor: "#e6b877" },
  },
};

export default config;
