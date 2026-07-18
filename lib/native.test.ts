import { describe, it, expect } from "vitest";
import { isNativeUserAgent, NATIVE_UA_TOKEN } from "./native-ua";

// The whole App Store 3.1.1 story hangs off this one string match: if it ever
// stops matching, the native build silently starts serving prices again.

const CAPACITOR_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 SolaspaceApp/1.0";
const SAFARI_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";

describe("isNativeUserAgent", () => {
  it("detects the Capacitor shell UA", () => {
    expect(isNativeUserAgent(CAPACITOR_UA)).toBe(true);
  });

  it("does not match plain iPhone Safari", () => {
    expect(isNativeUserAgent(SAFARI_UA)).toBe(false);
  });

  it("does not match an empty or missing UA", () => {
    expect(isNativeUserAgent("")).toBe(false);
    expect(isNativeUserAgent(null)).toBe(false);
    expect(isNativeUserAgent(undefined)).toBe(false);
  });

  it("matches any shell version, not just 1.0", () => {
    expect(isNativeUserAgent(`${SAFARI_UA} ${NATIVE_UA_TOKEN}2.3.1`)).toBe(true);
  });

  it("keeps the token in sync with lib/native.ts and capacitor.config.ts", () => {
    expect(NATIVE_UA_TOKEN).toBe("SolaspaceApp/");
  });
});
