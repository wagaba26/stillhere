import { describe, expect, it } from "vitest";
import { canOfferSubmitTool, readLowDataPreference, writeLowDataPreference } from "./preferences";

describe("local preferences and approval lifecycle", () => {
  it("stores and restores the low-data preference", () => {
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
});
