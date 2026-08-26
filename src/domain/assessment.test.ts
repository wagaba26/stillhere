import { describe, expect, it } from "vitest";
import { analyzePublicPage, createDemoAssessment } from "./assessment";

describe("website assessment analysis", () => {
  it("keeps the seeded challenge assessment deterministic", () => {
    const result = createDemoAssessment("2026-08-26T00:00:00.000Z");
    expect(result.source).toBe("SEEDED_DEMO");
    expect(result.business).toBe("Rwenzori Harvest Coffee Ltd");
    expect(result.currentBusinessStatus).toBe("Not yet attested");
  });

  it("extracts bounded public-page signals without attesting the business", () => {
    const result = analyzePublicPage({
      requestedUrl: "https://shop.example/",
      finalUrl: "https://www.shop.example/catalogue",
      observedAt: "2026-08-26T00:00:00.000Z",
      httpStatus: 200,
      transferredBytes: 4210,
      redirectCount: 1,
      html: `<!doctype html><html><head><meta property="og:site_name" content="Example &amp; Sons"><title>Ignored title</title></head><body><p>Catalogue updated 2025</p><a href="mailto:trade@example.test">Contact</a><script type="application/ld+json">{"@type":"Product"}</script></body></html>`,
    });

    expect(result.business).toBe("Example & Sons");
    expect(result.digitalFreshness).toBe("Recent signal observed");
    expect(result.latestVisibleUpdate).toBe("2025 observed in page text");
    expect(result.productsDetected).toBe(1);
    expect(result.currentBusinessStatus).toBe("Not attested");
    expect(result.productsConfirmedCurrent).toBe(0);
    expect(result.contactFlow).toContain("currentness unknown");
  });

  it("does not treat years inside scripts as a freshness signal", () => {
    const result = analyzePublicPage({
      requestedUrl: "https://example.com/",
      finalUrl: "https://example.com/",
      observedAt: "2026-08-26T00:00:00.000Z",
      httpStatus: 403,
      transferredBytes: 800,
      redirectCount: 0,
      html: `<html><head><title>Example Company | Home</title></head><body><p>Welcome</p><script>const build = 2026;</script></body></html>`,
    });

    expect(result.websiteStatus).toBe("Reached (HTTP 403)");
    expect(result.latestVisibleUpdate).toBe("No reliable year observed");
    expect(result.business).toBe("Example Company");
  });

  it("safely replaces invalid numeric HTML entities", () => {
    const result = analyzePublicPage({
      requestedUrl: "https://example.com/",
      finalUrl: "https://example.com/",
      observedAt: "2026-08-26T00:00:00.000Z",
      httpStatus: 200,
      transferredBytes: 100,
      redirectCount: 0,
      html: "<title>Example &#999999999999;</title>",
    });
    expect(result.business).toContain("�");
  });
});
