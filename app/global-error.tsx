"use client";

import { useEffect } from "react";

// Top-level boundary: catches errors thrown in the root layout itself (which
// the route-level app/error.tsx can't). It replaces the whole document, so it
// ships its own <html>/<body> and inline styles rather than relying on the app CSS.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Integration point for an error monitor (Sentry.captureException(error)).
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#0a0b0d", color: "#e8eaed", fontFamily: "system-ui, -apple-system, sans-serif", padding: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 420 }}>
          <div style={{ fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: "#7c828e" }}>Unexpected error</div>
          <h1 style={{ margin: "12px 0 0", fontSize: 30, fontWeight: 600 }}>Something slipped</h1>
          <p style={{ margin: "12px 0 0", color: "#9aa0aa", fontSize: 15, lineHeight: 1.6 }}>Solaspace hit a snag. Reloading usually fixes it.</p>
          <button onClick={reset} style={{ marginTop: 28, height: 44, padding: "0 24px", borderRadius: 12, border: "none", background: "#e6b877", color: "#1b1206", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
