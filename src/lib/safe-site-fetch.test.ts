import { describe, expect, it } from "vitest";
import {
  isPublicIpAddress,
  parseAssessmentUrl,
  SafeFetchError,
} from "./safe-site-fetch";

describe("safe public-site URL handling", () => {
  it("normalizes a bare public hostname", () => {
    expect(parseAssessmentUrl("example.com/path").toString()).toBe(
      "https://example.com/path",
    );
  });

  it.each([
    "127.0.0.1",
    "10.2.3.4",
    "169.254.169.254",
    "172.20.0.1",
    "192.168.1.1",
    "198.51.100.4",
    "203.0.113.9",
    "::1",
    "fc00::1",
    "fe80::1",
    "2001:db8::1",
    "2001:0db8::1",
    "2001:0000::1",
    "2002:c0a8:0001::",
  ])("rejects non-public IP address %s", (address) => {
    expect(isPublicIpAddress(address)).toBe(false);
  });

  it.each(["93.184.216.34", "2606:4700:4700::1111"])(
    "allows public IP address %s",
    (address) => {
      expect(isPublicIpAddress(address)).toBe(true);
    },
  );

  it.each([
    "http://localhost",
    "http://127.0.0.1/admin",
    "http://metadata.google.internal",
    "https://service.internal",
    "https://example.test",
    "https://example.com:8443",
    "https://user:secret@example.com",
  ])("blocks unsafe destination %s", (input) => {
    expect(() => parseAssessmentUrl(input)).toThrow(SafeFetchError);
  });
});
