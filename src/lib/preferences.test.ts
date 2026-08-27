import { describe, expect, it } from "vitest";
import {
  canOfferSubmitTool,
  clearAttestationSnapshot,
  readAttestationSnapshot,
  readLowDataPreference,
  writeLowDataPreference,
} from "./preferences";

describe("local preferences and approval lifecycle", () => {
  it("stores and restores the Simplified view preference", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };
    writeLowDataPreference(true, storage);
    expect(readLowDataPreference(storage)).toBe(true);
    writeLowDataPreference(false, storage);
    expect(readLowDataPreference(storage)).toBe(false);
  });

  it("offers the submit tool only for valid, explicitly approved state", () => {
    expect(canOfferSubmitTool(true, true)).toBe(true);
    expect(canOfferSubmitTool(false, true)).toBe(false);
    expect(canOfferSubmitTool(true, false)).toBe(false);
  });

  it("clears only the compatibility attestation and preserves Simplified view", () => {
    const values = new Map<string, string>([
      ["stillhere-low-data", "true"],
      ["stillhere-demo-attestation-v1", "{}"],
      ["unrelated-origin-setting", "preserve"],
    ]);
    clearAttestationSnapshot({ removeItem: (key) => values.delete(key) });
    expect(values.get("stillhere-demo-attestation-v1")).toBeUndefined();
    expect(values.get("stillhere-low-data")).toBe("true");
    expect(values.get("unrelated-origin-setting")).toBe("preserve");
  });

  it("rejects malformed nested legacy attestation state", () => {
    const storage = {
      getItem: () =>
        JSON.stringify({
          identity: {
            name: "Demo",
            description: "Demo",
            country: "Uganda",
            sector: "Coffee",
          },
          contactStates: { phone: "CURRENT" },
          productStates: { instant: "INVENTED" },
          capabilities: {
            b2bInquiries: true,
            exports: true,
            samples: true,
            privateLabel: true,
          },
          marketsServed: ["Uganda"],
          workflow: "REQUEST_QUOTATION",
          attestedAt: "2026-08-26T00:00:00.000Z",
        }),
    };
    expect(readAttestationSnapshot(storage)).toBeNull();
  });
});
