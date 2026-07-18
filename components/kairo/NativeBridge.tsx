"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";

// The one place the web app talks to the native shell.
//
// Mounted once inside the app layout. On the web every branch here is dead: the
// Capacitor packages ship a browser shim where `isNativePlatform()` is false, so
// nothing runs and nothing is imported that would bloat the web bundle beyond
// the shim itself.
//
// Everything is loaded with dynamic import on purpose. If a plugin is missing
// from a given native build, the feature degrades instead of white-screening the
// app, which matters because the shell loads over the network and a throw here
// would leave the user with the splash screen and no way forward.

const OFFLINE_PATH = "offline.html";

export function NativeBridge() {
  const router = useRouter();

  React.useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let disposed = false;
    const cleanups: Array<() => void> = [];

    // Marks the document so `.is-native` CSS applies: no long-press callouts,
    // no tap highlights, no text selection outside inputs.
    document.documentElement.classList.add("is-native");

    void (async () => {
      // The splash is held open by config (launchAutoHide: false) because the
      // app is fetched over the network. We are inside a mounted React effect,
      // so the first screen has painted and it is safe to reveal it now.
      try {
        const { SplashScreen } = await import("@capacitor/splash-screen");
        await SplashScreen.hide({ fadeOutDuration: 220 });
      } catch {
        /* plugin absent: the splash auto-hides on its own timeout */
      }
      if (disposed) return;

      // Dark status bar content over the near-black canvas.
      try {
        const { StatusBar, Style } = await import("@capacitor/status-bar");
        await StatusBar.setStyle({ style: Style.Dark });
      } catch {
        /* not fatal, iOS defaults are close enough */
      }
      if (disposed) return;

      // Android hardware back button: walk our own history rather than closing
      // the app on the first press, which is what Capacitor does by default.
      try {
        const { App } = await import("@capacitor/app");
        const handle = await App.addListener("backButton", ({ canGoBack }) => {
          if (canGoBack) router.back();
          else void App.exitApp();
        });
        cleanups.push(() => void handle.remove());
      } catch {
        /* iOS has no hardware back button */
      }
      if (disposed) return;

      // If the connection drops mid-session, show the bundled offline screen
      // rather than leaving a half-rendered page the user can still tap.
      try {
        const { Network } = await import("@capacitor/network");
        const handle = await Network.addListener("networkStatusChange", (s) => {
          if (!s.connected) window.location.replace(OFFLINE_PATH);
        });
        cleanups.push(() => void handle.remove());
      } catch {
        /* without the plugin we simply rely on server.errorPath */
      }
    })();

    return () => {
      disposed = true;
      cleanups.forEach((fn) => fn());
      document.documentElement.classList.remove("is-native");
    };
  }, [router]);

  return null;
}
