"use client";

import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import type { WebsiteAssessment } from "@/domain/assessment";
import { DEMO_LEGACY_URL } from "@/domain/demo-data";
import { formatBytes } from "@/lib/format";

interface AssessmentResponse {
  assessment?: WebsiteAssessment;
  error?: string;
}

export function AssessmentExperience() {
  const [url, setUrl] = useState(DEMO_LEGACY_URL);
  const [result, setResult] = useState<WebsiteAssessment | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function runAssessment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const candidate = url.trim();
    if (!candidate) {
      setError("Enter a public website URL.");
      setResult(null);
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12_000);
    try {
      const response = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: candidate }),
        signal: controller.signal,
      });
      const payload = (await response.json()) as AssessmentResponse;
      if (!response.ok || !payload.assessment) {
        throw new Error(payload.error ?? "The website could not be assessed safely.");
      }
      setResult(payload.assessment);
    } catch (caught) {
      setResult(null);
      setError(
        caught instanceof DOMException && caught.name === "AbortError"
          ? "The assessment took too long. The site may be slow or blocking automated requests."
          : caught instanceof Error
            ? caught.message
            : "The website could not be assessed safely.",
      );
    } finally {
      window.clearTimeout(timeout);
      setLoading(false);
    }
  }

  function resetAssessment() {
    setResult(null);
    setError("");
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  return (
    <div className="shell assessment-shell">
      <div className="page-intro">
        <p className="eyebrow">Stage A · Assess</p>
        <h1>Check a business website</h1>
        <p>
          Observe the condition of one public page without treating website
          freshness as proof that a business is active or inactive.
        </p>
      </div>

      <form className="scan-form" onSubmit={runAssessment} noValidate aria-busy={loading}>
        <label htmlFor="website-url">Business website URL</label>
        <div className="scan-input-row">
          <input
            ref={inputRef}
            id="website-url"
            type="text"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={url}
            onChange={(event) => {
              setUrl(event.target.value);
              setError("");
            }}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "url-error scan-note" : "scan-note"}
            placeholder="https://example.com"
          />
          <button className="button button-primary" type="submit" disabled={loading}>
            {loading ? "Assessing…" : "Assess website"}
          </button>
        </div>
        {error && <p className="field-error" id="url-error" role="alert">{error}</p>}
        <p className="form-note" id="scan-note">
          One public HTML page only. Private networks, credentials, unusual ports,
          unchecked redirects, large responses, and page JavaScript are blocked.
        </p>
      </form>

      {!result ? (
        <section className="assessment-preview" aria-label="What this assessment checks">
          <div><span aria-hidden="true">01</span><p>Public reachability and HTTP response</p></div>
          <div><span aria-hidden="true">02</span><p>Visible recency and contact signals</p></div>
          <div><span aria-hidden="true">03</span><p>Structured product signals—not currentness</p></div>
        </section>
      ) : (
        <section className="assessment-result" aria-live="polite">
          <div className="result-header">
            <div>
              <p className="eyebrow">Assessment complete</p>
              <h2>{result.business}</h2>
            </div>
            <span className="reachable-badge"><span aria-hidden="true" /> {result.websiteStatus}</span>
          </div>

          <div className="critical-distinction">
            <strong>Website condition is not business condition.</strong>
            <p>{result.summary}</p>
          </div>

          <dl className="result-grid">
            <div><dt>Digital freshness</dt><dd className={result.digitalFreshness === "Low" ? "low-value" : undefined}>{result.digitalFreshness}</dd></div>
            <div><dt>Latest visible signal</dt><dd>{result.latestVisibleUpdate}</dd></div>
            <div><dt>Current business status</dt><dd>{result.currentBusinessStatus}</dd></div>
            <div><dt>Contact flow</dt><dd>{result.contactFlow}</dd></div>
            <div><dt>Product schema signals</dt><dd>{result.productsDetected}</dd></div>
            <div><dt>Products confirmed current</dt><dd>{result.productsConfirmedCurrent}</dd></div>
            <div><dt>Information conflicts</dt><dd>{result.conflicts}</dd></div>
            <div><dt>Recent public evidence</dt><dd>{result.recentPublicEvidence}</dd></div>
          </dl>

          <div className="workflow-recommendation">
            <span>Recommended continuity workflow</span>
            <strong>{result.recommendedWorkflow}</strong>
          </div>

          <div className="observation-note">
            <div>
              <strong>{result.source === "SEEDED_DEMO" ? "Seeded challenge result" : "Bounded public-page observation"}</strong>
              <span>
                HTTP {result.httpStatus} · {formatBytes(result.transferredBytes)} observed · {result.redirectCount} redirect{result.redirectCount === 1 ? "" : "s"}
              </span>
            </div>
            <p>{result.limitations.join(" ")}</p>
          </div>

          <div className="button-row result-actions">
            {result.source === "SEEDED_DEMO" ? (
              <>
                <Link className="button button-primary" href="/recover">Recover &amp; attest current information <span aria-hidden="true">→</span></Link>
                <Link className="button button-secondary" href="/business/rwenzori-harvest">Skip to published demo profile</Link>
              </>
            ) : (
              <>
                <button className="button button-primary" type="button" onClick={resetAssessment}>Assess another website</button>
                <Link className="button button-secondary" href="/recover">Explore the fictional attestation demo</Link>
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
