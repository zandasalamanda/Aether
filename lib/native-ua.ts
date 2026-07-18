// Pure, environment-free User-Agent matching for the native shell.
//
// `lib/native.ts` is server-only (it reads next/headers), so it cannot be
// imported from a Client Component or unit-tested without mocking Next. This
// module holds the actual matching rule so both sides share one definition:
// the server guard composes it with the request headers, client code can apply
// it to navigator.userAgent, and a test can exercise it directly.

/** The token the native shell appends to the User-Agent. Keep in sync with capacitor.config.ts. */
export const NATIVE_UA_TOKEN = "SolaspaceApp/";

/** True when this User-Agent string belongs to the Solaspace native shell. */
export function isNativeUserAgent(ua: string | null | undefined): boolean {
  return typeof ua === "string" && ua.includes(NATIVE_UA_TOKEN);
}
