import "server-only";
import { headers } from "next/headers";
import { isNativeUserAgent, NATIVE_UA_TOKEN } from "@/lib/native-ua";

// The matching rule itself lives in lib/native-ua.ts, which is environment
// free so Client Components and unit tests can use it too. Re-exported here so
// server callers have one import.
export { NATIVE_UA_TOKEN };

// Is this request coming from the Solaspace native shell rather than a browser?
//
// The native app is a Capacitor wrapper that loads this same site over the
// network, so there is no separate build to branch on. It identifies itself by
// appending a token to the User-Agent (`appendUserAgent` in capacitor.config.ts).
//
// Detecting on the server rather than the client is deliberate. Most of this
// app renders on the server, so a client-side check would let a web-only
// element (a price, an upgrade card) paint for a frame before being removed.
// On the App Store that flash is not a cosmetic bug, it is a Guideline 3.1.1
// violation, so the decision has to happen before anything is sent.

export async function isNativeRequest(): Promise<boolean> {
  return isNativeUserAgent((await headers()).get("user-agent"));
}
