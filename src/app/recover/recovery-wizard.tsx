"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { business, legacyContacts } from "@/domain/demo-data";
import type { AttestationSnapshot, PrimaryWorkflow, ProductStatus } from "@/domain/types";
import { EvidenceBadge } from "@/components/evidence-badge";
import { productStatusLabel } from "@/lib/format";
import { writeAttestationSnapshot } from "@/lib/preferences";

const steps = ["Identity", "Contacts", "Products", "Capabilities", "Workflow", "Review"];

const workflowOptions: { value: PrimaryWorkflow; label: string; description: string }[] = [
  { value: "REQUEST_QUOTATION", label: "Request quotation", description: "Structured B2B pricing and fulfilment inquiry." },
  { value: "REQUEST_SAMPLES", label: "Request samples", description: "Request evaluation units before a larger order." },
  { value: "DISTRIBUTION_INQUIRY", label: "Distribution inquiry", description: "Explore a regional reseller or distribution relationship." },
  { value: "PRODUCT_AVAILABILITY_INQUIRY", label: "Product availability inquiry", description: "Confirm supply for a particular market and period." },
];

export function RecoveryWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [identity, setIdentity] = useState({
    name: business.name,
    description: business.description,
    country: business.country,
    sector: business.sector,
  });
  const [contactStates, setContactStates] = useState<
    Record<string, "CURRENT" | "OUTDATED" | "UNKNOWN">
  >({
    [legacyContacts[0].value]: "OUTDATED",
    [legacyContacts[1].value]: "CURRENT",
    [legacyContacts[2].value]: "CURRENT",
  });
  const [productStates, setProductStates] = useState<Record<string, ProductStatus>>(
    Object.fromEntries(business.products.map((product) => [product.id, product.status])),
  );
  const [capabilities, setCapabilities] = useState({
    b2bInquiries: true,
    exports: true,
    samples: true,
    privateLabel: true,
  });
  const [marketsServed, setMarketsServed] = useState(
    business.capabilities.marketsServed.join(", "),
  );
  const [workflow, setWorkflow] = useState<PrimaryWorkflow>("REQUEST_QUOTATION");

  function next() {
    setStep((current) => Math.min(steps.length - 1, current + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    setStep((current) => Math.max(0, current - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function publish() {
    const snapshot: AttestationSnapshot = {
      identity,
      contactStates,
      productStates,
      capabilities,
      marketsServed: marketsServed
        .split(",")
        .map((market) => market.trim())
        .filter(Boolean),
      workflow,
      attestedAt: "2026-08-26",
    };
    writeAttestationSnapshot(snapshot, window.localStorage);
    router.push("/business/rwenzori-harvest");
  }

  const currentContacts = legacyContacts.filter(
    (contact) => contactStates[contact.value] === "CURRENT",
  );
  const workflowLabel = workflowOptions.find(
    (option) => option.value === workflow,
  )?.label;

  return (
    <div className="shell recovery-shell">
      <div className="page-intro recovery-intro">
        <p className="eyebrow">Stage B · Recover</p>
        <h1>Information Attestation</h1>
        <p>Confirm individual facts as current. This is not identity, legal-status, or government-record verification.</p>
      </div>

      <nav className="wizard-progress" aria-label="Attestation progress">
        <ol>
          {steps.map((label, index) => (
            <li key={label} className={index === step ? "current" : index < step ? "complete" : ""} aria-current={index === step ? "step" : undefined}>
              <span>{index < step ? "✓" : index + 1}</span><small>{label}</small>
            </li>
          ))}
        </ol>
      </nav>

      <section className="wizard-card">
        {step === 0 && (
          <div className="wizard-section">
            <div className="wizard-heading"><span>1 of 6</span><h2>Business identity</h2><p>Start with descriptive facts a representative can directly confirm.</p></div>
            <div className="field-grid two-column">
              <label>Company name<input value={identity.name} onChange={(event) => setIdentity((current) => ({ ...current, name: event.target.value }))} /></label>
              <label>Country<input value={identity.country} onChange={(event) => setIdentity((current) => ({ ...current, country: event.target.value }))} /></label>
              <label className="full-field">Short description<textarea value={identity.description} onChange={(event) => setIdentity((current) => ({ ...current, description: event.target.value }))} rows={4} /></label>
              <label className="full-field">Business sector<input value={identity.sector} onChange={(event) => setIdentity((current) => ({ ...current, sector: event.target.value }))} /></label>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="wizard-section">
            <div className="wizard-heading"><span>2 of 6</span><h2>Contact information</h2><p>Resolve legacy contact details one item at a time.</p></div>
            <div className="decision-list">
              {legacyContacts.map((contact) => (
                <fieldset key={contact.value}>
                  <legend><strong>{contact.value}</strong><span>{contact.label}</span></legend>
                  <EvidenceBadge state={contact.evidenceState} />
                  <div className="segmented-options">
                    {["CURRENT", "OUTDATED", "UNKNOWN"].map((value) => (
                      <label key={value}><input type="radio" name={contact.value} value={value} checked={contactStates[contact.value] === value} onChange={() => setContactStates((current) => ({ ...current, [contact.value]: value as "CURRENT" | "OUTDATED" | "UNKNOWN" }))} /><span>{value.charAt(0) + value.slice(1).toLocaleLowerCase()}</span></label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="wizard-section">
            <div className="wizard-heading"><span>3 of 6</span><h2>Current products</h2><p>Only products marked current or seasonal can appear on the continuity profile.</p></div>
            <div className="product-decision-list">
              {business.products.map((product) => (
                <fieldset key={product.id}>
                  <legend><strong>{product.name}</strong><span>{product.packaging} · MOQ {product.moq}</span></legend>
                  <select aria-label={`${product.name} status`} value={productStates[product.id]} onChange={(event) => setProductStates((current) => ({ ...current, [product.id]: event.target.value as ProductStatus }))}>
                    {(["CURRENTLY_AVAILABLE", "SEASONAL", "DISCONTINUED", "UNKNOWN"] as ProductStatus[]).map((status) => <option key={status} value={status}>{productStatusLabel(status)}</option>)}
                  </select>
                </fieldset>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="wizard-section">
            <div className="wizard-heading"><span>4 of 6</span><h2>Business capabilities</h2><p>Confirm only services the business can currently support.</p></div>
            <div className="capability-options">
              {Object.entries({ b2bInquiries: "B2B inquiries", exports: "Export orders", samples: "Product samples", privateLabel: "Private-label supply" }).map(([key, label]) => (
                <label key={key}><input type="checkbox" checked={capabilities[key as keyof typeof capabilities]} onChange={(event) => setCapabilities((current) => ({ ...current, [key]: event.target.checked }))} /><span aria-hidden="true" /><strong>{label}</strong></label>
              ))}
            </div>
            <label className="markets-field">Markets currently served<input value={marketsServed} onChange={(event) => setMarketsServed(event.target.value)} /><small>Use specific regions or countries that can be supported now.</small></label>
          </div>
        )}

        {step === 4 && (
          <div className="wizard-section">
            <div className="wizard-heading"><span>5 of 6</span><h2>Choose one primary customer workflow</h2><p>A small, high-value tool is more dependable than exposing every possible website action.</p></div>
            <div className="workflow-options">
              {workflowOptions.map((option) => (
                <label key={option.value} className={workflow === option.value ? "selected" : ""}><input type="radio" name="workflow" value={option.value} checked={workflow === option.value} onChange={() => setWorkflow(option.value)} /><span className="radio-mark" aria-hidden="true" /><span><strong>{option.label}</strong><small>{option.description}</small></span></label>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="wizard-section review-section">
            <div className="wizard-heading"><span>6 of 6</span><h2>Review before publishing</h2><p>This summary separates confirmed claims from unresolved legacy information.</p></div>
            <div className="review-banner"><span aria-hidden="true">✓</span><div><strong>Ready to publish a continuity profile</strong><p>{business.products.filter((product) => productStates[product.id] === "CURRENTLY_AVAILABLE").length} products current · {Object.values(capabilities).filter(Boolean).length} capabilities confirmed · {workflowLabel} selected</p></div></div>
            <dl className="review-list">
              <div><dt>Business</dt><dd>{identity.name}<br />{identity.country} · {identity.sector}</dd></div>
              <div><dt>Current contact</dt><dd>{currentContacts.map((contact) => <span key={contact.value}>{contact.value}<br /></span>)}</dd></div>
              <div><dt>Evidence state</dt><dd><EvidenceBadge state="OWNER_CONFIRMED" /></dd></div>
              <div><dt>Primary workflow</dt><dd>{workflowLabel}</dd></div>
            </dl>
            <div className="attestation-note"><strong>What this attestation means</strong><p>A fictional demo representative has confirmed these information items as current on 26 August 2026. StillHere does not claim that an identity, legal entity, government record, or certification has been verified.</p></div>
          </div>
        )}

        <div className="wizard-actions">
          <button className="button button-quiet" type="button" onClick={back} disabled={step === 0}>Back</button>
          {step < steps.length - 1 ? <button className="button button-primary" type="button" onClick={next}>Continue <span aria-hidden="true">→</span></button> : <button className="button button-primary" type="button" onClick={publish}>Publish demo profile <span aria-hidden="true">→</span></button>}
        </div>
      </section>
    </div>
  );
}
