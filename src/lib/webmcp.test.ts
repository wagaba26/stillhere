import { describe, expect, it } from "vitest";
import { asToolInput, hasWebMcp, requiredString } from "./webmcp";

describe("WebMCP boundary", () => {
  it("feature-detects the browser API", () => {
    expect(hasWebMcp(undefined)).toBe(false);
    expect(
      hasWebMcp({
        modelContext: { registerTool: async () => undefined },
      } as Pick<Document, "modelContext">),
    ).toBe(true);
  });

  it("rejects non-object and missing required tool input", () => {
    expect(() => asToolInput("unsafe")).toThrow("must be an object");
    expect(() => requiredString({}, "buyerEmail")).toThrow("buyerEmail is required");
  });
});
