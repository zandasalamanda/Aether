"use client";

import * as React from "react";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";

/**
 * A drop-in replacement for `<a target="_blank">`.
 *
 * On the web this renders exactly the anchor it replaces, so nothing about the
 * site changes. Inside the native shell `target="_blank"` is a silent no-op in
 * WKWebView, so the click is intercepted and handed to an in-app browser
 * (SFSafariViewController) with a Done button. mailto: and other schemes go the
 * same route so the OS can hand them to the right app.
 */
// `href` stays optional so this is a true drop-in for anchors whose URL can be
// absent; an anchor with no href renders exactly as it did before.
export type ExternalLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & { href?: string };

export function ExternalLink({ href, children, className, rel, target, onClick, ...rest }: ExternalLinkProps): React.JSX.Element {
  // Read at render time, never at module scope, so SSR stays safe. On web the
  // Capacitor shim returns false.
  const native = typeof window !== "undefined" && Capacitor.isNativePlatform();

  // mailto:/tel: hand off to the OS and must not be given a target, or some
  // browsers leave a blank tab behind. Only http(s) gets the new-tab treatment.
  const handoff = !!href && /^(mailto:|tel:|sms:)/i.test(href);
  const webTarget = target ?? (handoff ? undefined : "_blank");

  const handleClick = React.useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      onClick?.(e);
      if (!native || !href || e.defaultPrevented) return;
      e.preventDefault();
      void Browser.open({ url: href, presentationStyle: "popover" });
    },
    [native, href, onClick],
  );

  return (
    <a
      href={href}
      className={className}
      rel={rel ?? (webTarget === "_blank" ? "noopener noreferrer" : undefined)}
      target={native ? undefined : webTarget}
      onClick={handleClick}
      {...rest}
    >
      {children}
    </a>
  );
}
