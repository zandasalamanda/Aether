"use client";

import * as React from "react";

/**
 * A DOM id for an SVG paint server (gradient, mask, filter, clipPath, pattern)
 * that is unique to this component INSTANCE and safe to put inside `url(#...)`.
 *
 * Use this for EVERY `<defs>` id. A hardcoded id has now broken mobile twice,
 * and the failure looks like a design bug rather than a rendering one: the
 * shape paints FLAT BLACK, so it reads as "there is a black orb on the page".
 *
 * Two independent ways a literal id fails, both mobile-only:
 *
 *  1. Duplicate ids. The app shell renders a Sidebar AND a BottomNav, and at
 *     phone width the Sidebar is `display:none`. WebKit does not paint a
 *     gradient defined inside a display:none subtree, so whichever instance
 *     came first wins the id and every other reference resolves to nothing.
 *     This is exactly how the logo blacked out.
 *  2. Unsanitised React ids. `React.useId()` returns delimiters around the
 *     value, and those characters are not valid in a url(#...) reference, so
 *     the reference silently fails to resolve.
 *
 * Stripping to [A-Za-z0-9-] fixes (2), and useId's per-instance value fixes (1).
 *
 * `svg-id.test.ts` fails the build if any `<defs>` child is given a literal id,
 * so this cannot quietly regress again.
 */
export function useSvgId(prefix: string): string {
  const raw = React.useId();
  return `${prefix}-${raw.replace(/[^a-zA-Z0-9-]/g, "")}`;
}
