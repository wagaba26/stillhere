import { describe, expect, it } from "vitest";
import { POST } from "./route";

function request(url: string, origin = "http://localhost") {
  return new Request("http://localhost/api/assessments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: origin,
      "X-Real-IP": `test-${Math.random()}`,
    },
    body: JSON.stringify({ url }),
  });
}

describe("POST /api/assessments", () => {
  it("returns the deterministic demo through the production API contract", async () => {
    const response = await POST(
      request("https://legacy.rwenzoriharvest.example"),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(payload.assessment.source).toBe("SEEDED_DEMO");
  });

  it("blocks private network targets before any outbound request", async () => {
    const response = await POST(request("http://169.254.169.254/latest/meta-data"));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.code).toBe("UNSAFE_DESTINATION");
  });

  it("rejects cross-origin browser requests", async () => {
    const response = await POST(
      request("https://legacy.rwenzoriharvest.example", "https://attacker.example"),
    );
    expect(response.status).toBe(403);
  });
});
