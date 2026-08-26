"use client";

import Link from "next/link";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { EvidenceBadge } from "@/components/evidence-badge";
import { SiteFooter } from "@/components/site-footer";
import { business } from "@/domain/demo-data";
import {
  createIdempotencyKey,
  emptyInquiry,
  prepareInquiry,
  validateInquiry,
} from "@/domain/inquiry";
import type {
  ActivityEntry,
  AttestationSnapshot,
  BusinessProfile,
  InquiryDraft,
  InquiryField,
  InquiryReceipt,
} from "@/domain/types";
import { useWebMcp } from "@/hooks/use-webmcp";
import { formatAttestedDate, formatBytes, productStatusLabel } from "@/lib/format";
import { loadDraft, loadReceipt, saveDraft, saveReceipt } from "@/lib/indexed-db";
import {
  measureBrowserResources,
  readAttestationSnapshot,
  readLowDataPreference,
  writeLowDataPreference,
  type ResourceMeasurement,
} from "@/lib/preferences";

type SubmissionState =
  | "DRAFT SAVED ON THIS DEVICE"
  | "SUBMISSION PENDING"
  | "SUBMITTING"
  | "SUBMITTED";

type DraftPersistenceState = "saving" | "saved" | "error";

const initialDraft: InquiryDraft = {
  productId: "",
  quantity: "",
  destinationCountry: "",
  requestSamples: false,
  privateLabel: false,
  buyerCompany: "",
  buyerName: "",
  buyerEmail: "",
  questions: "",
  idempotencyKey: "",
  updatedAt: "",
};

const initialMeasurement: ResourceMeasurement = {
  resources: 0,
  transferredBytes: 0,
  encodedBytes: 0,
  measuredAt: "",
};

export function ProfileExperience() {
  const [draft, setDraft] = useState<InquiryDraft>(initialDraft);
  const draftRef = useRef(draft);
  const [hydratedDraft, setHydratedDraft] = useState(false);
  const [approved, setApproved] = useState(false);
  const [agentFields, setAgentFields] = useState<Set<InquiryField>>(new Set());
  const [submissionState, setSubmissionState] =
    useState<SubmissionState>("DRAFT SAVED ON THIS DEVICE");
  const [draftPersistence, setDraftPersistence] =
    useState<DraftPersistenceState>("saving");
  const [receipt, setReceipt] = useState<InquiryReceipt | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [online, setOnline] = useState(true);
  const [offlineProfileAvailable, setOfflineProfileAvailable] = useState(false);
  const [lowData, setLowData] = useState(false);
  const [measurement, setMeasurement] = useState(initialMeasurement);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [attestation, setAttestation] = useState<AttestationSnapshot | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const profile = useMemo<BusinessProfile>(() => {
    if (!attestation) return business;
    return {
      ...business,
      ...attestation.identity,
      lastAttested: attestation.attestedAt,
      workflow: attestation.workflow,
      capabilities: {
        ...business.capabilities,
        ...attestation.capabilities,
        marketsServed: attestation.marketsServed,
      },
      products: business.products.map((product) => ({
        ...product,
        status: attestation.productStates[product.id] ?? product.status,
      })),
    };
  }, [attestation]);

  const validation = useMemo(() => validateInquiry(draft, profile), [draft, profile]);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  const addActivity = useCallback(
    (entry: Omit<ActivityEntry, "id" | "timestamp">) => {
      setActivity((current) => [
        {
          ...entry,
          id: createIdempotencyKey(),
          timestamp: new Date().toISOString(),
        },
        ...current,
      ].slice(0, 12));
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    async function restoreDraft() {
      try {
        const stored = await loadDraft();
        if (!cancelled) {
          setDraft(stored ?? emptyInquiry());
          setDraftPersistence(stored ? "saved" : "saving");
        }
      } catch {
        if (!cancelled) {
          setDraft(emptyInquiry());
          setDraftPersistence("error");
        }
      } finally {
        if (!cancelled) setHydratedDraft(true);
      }
    }
    void restoreDraft();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydratedDraft || !draft.idempotencyKey) return;
    const timer = window.setTimeout(() => {
      setDraftPersistence("saving");
      void saveDraft(draft)
        .then(() => setDraftPersistence("saved"))
        .catch(() => setDraftPersistence("error"));
    }, 180);
    return () => window.clearTimeout(timer);
  }, [draft, hydratedDraft]);

  useEffect(() => {
    const updateNetwork = () => setOnline(navigator.onLine);
    updateNetwork();
    window.addEventListener("online", updateNetwork);
    window.addEventListener("offline", updateNetwork);
    navigator.serviceWorker?.ready
      .then(async () => {
        const cachedProfile = await caches.match("/business/rwenzori-harvest");
        setOfflineProfileAvailable(Boolean(cachedProfile));
      })
      .catch(() => undefined);
    return () => {
      window.removeEventListener("online", updateNetwork);
      window.removeEventListener("offline", updateNetwork);
    };
  }, []);

  useEffect(() => {
    const stored = readLowDataPreference(window.localStorage);
    const storedAttestation = readAttestationSnapshot(window.localStorage);
    queueMicrotask(() => setLowData(stored));
    queueMicrotask(() => setAttestation(storedAttestation));
    document.documentElement.dataset.lowData = String(stored);
    const refresh = () => setMeasurement(measureBrowserResources(performance));
    const timer = window.setTimeout(refresh, 800);
    window.addEventListener("load", refresh);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("load", refresh);
    };
  }, []);

  function toggleLowData() {
    const next = !lowData;
    setLowData(next);
    document.documentElement.dataset.lowData = String(next);
    writeLowDataPreference(next, window.localStorage);
    window.setTimeout(
      () => setMeasurement(measureBrowserResources(performance)),
      0,
    );
  }

  function updateField<K extends InquiryField>(field: K, value: InquiryDraft[K]) {
    setApproved(false);
    setReceipt(null);
    setSubmitError("");
    setSubmissionState("DRAFT SAVED ON THIS DEVICE");
    setDraftPersistence("saving");
    setAgentFields((current) => {
      const next = new Set(current);
      next.delete(field);
      return next;
    });
    setDraft((current) => ({
      ...current,
      [field]: value,
      idempotencyKey:
        submissionState === "SUBMITTED" || submissionState === "SUBMISSION PENDING"
          ? createIdempotencyKey()
          : current.idempotencyKey,
      updatedAt: new Date().toISOString(),
    }));
  }

  async function handleAgentPrepare(
    values: Partial<Omit<InquiryDraft, "idempotencyKey" | "updatedAt">>,
    fields: InquiryField[],
  ) {
    const prepared = prepareInquiry(values, draftRef.current, profile);
    setApproved(false);
    setReceipt(null);
    setSubmitError("");
    setSubmissionState("DRAFT SAVED ON THIS DEVICE");
    setDraftPersistence("saving");
    setAgentFields(new Set(fields));
    setDraft(prepared);
    draftRef.current = prepared;
    try {
      await saveDraft(prepared);
      setDraftPersistence("saved");
    } catch (error) {
      setDraftPersistence("error");
      throw error;
    }
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    formRef.current?.querySelector<HTMLElement>("input, select, textarea")?.focus({
      preventScroll: true,
    });
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const checked = validateInquiry(prepared, profile);
    return {
      draft: prepared,
      valid: checked.valid,
      missingFields: Object.keys(checked.errors),
    };
  }

  async function performSubmit() {
    const current = draftRef.current;
    const checked = validateInquiry(current, profile);
    if (!approved || !checked.valid) {
      throw new Error("Review approval and all required fields are needed.");
    }

    const previousReceipt = await loadReceipt(current.idempotencyKey).catch(
      () => undefined,
    );
    if (previousReceipt) {
      setReceipt(previousReceipt);
      setSubmissionState("SUBMITTED");
      setApproved(false);
      return { ...previousReceipt, duplicate: true };
    }

    if (!navigator.onLine) {
      try {
        await saveDraft(current);
        setDraftPersistence("saved");
      } catch {
        setDraftPersistence("error");
      }
      setSubmissionState("SUBMISSION PENDING");
      setSubmitError("You are offline. The draft is saved, but nothing was submitted.");
      throw new Error("Offline — draft saved locally; submission is still pending.");
    }

    setSubmissionState("SUBMITTING");
    setSubmitError("");
    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": current.idempotencyKey,
        },
        body: JSON.stringify(current),
      });
      const payload = (await response.json()) as {
        receipt?: InquiryReceipt;
        duplicate?: boolean;
        error?: string;
      };
      if (!response.ok || !payload.receipt) {
        throw new Error(payload.error ?? "The inquiry could not be submitted.");
      }
      setReceipt(payload.receipt);
      setSubmissionState("SUBMITTED");
      setApproved(false);
      try {
        await saveReceipt(payload.receipt);
      } catch {
        setSubmitError(
          "Submitted successfully, but the receipt could not be cached on this device.",
        );
      }
      return { ...payload.receipt, duplicate: Boolean(payload.duplicate) };
    } catch (error) {
      try {
        await saveDraft(current);
        setDraftPersistence("saved");
      } catch {
        setDraftPersistence("error");
      }
      setSubmissionState("SUBMISSION PENDING");
      const message =
        error instanceof Error
          ? error.message
          : "Network request failed. The draft remains on this device.";
      setSubmitError(message);
      throw error;
    }
  }

  const { status: webMcpStatus, submitToolAvailable } = useWebMcp({
    approved,
    valid: validation.valid,
    profile,
    onPrepare: handleAgentPrepare,
    onSubmit: performSubmit,
    addActivity,
  });

  async function submitManually(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await performSubmit();
    } catch {
      // The visible status region already carries the actionable failure.
    }
  }

  const currentProducts = profile.products.filter(
    (product) =>
      product.status === "CURRENTLY_AVAILABLE" || product.status === "SEASONAL",
  );

  const visibleSubmissionState =
    submissionState === "DRAFT SAVED ON THIS DEVICE"
      ? draftPersistence === "saved"
        ? "DRAFT SAVED ON THIS DEVICE"
        : draftPersistence === "error"
          ? "DRAFT SAVE FAILED"
          : "SAVING DRAFT"
      : submissionState;

  return (
    <div className="profile-page">
      <header className="profile-topbar">
        <div className="shell profile-topbar-inner">
          <Link className="wordmark" href="/" aria-label="StillHere home">
            <span aria-hidden="true" className="wordmark-mark">S</span><span>StillHere</span>
          </Link>
          <div className="profile-controls">
            <span className={`connection-status ${online ? "online" : "offline"}`}>
              <span aria-hidden="true" />{online ? "Online" : offlineProfileAvailable ? "Offline — profile available" : "Offline"}
            </span>
            <button className={`low-data-toggle ${lowData ? "enabled" : ""}`} type="button" onClick={toggleLowData} aria-pressed={lowData}>
              <span className="toggle-track" aria-hidden="true"><i /></span>Low Data
            </button>
          </div>
        </div>
      </header>

      <main id="main-content">
        <section className="business-hero shell">
          <div className="business-hero-copy">
            <p className="profile-category">Coffee producer &amp; exporter · Uganda</p>
            <h1>{profile.name}</h1>
            <div className="attested-line">
              <span className="active-pill large"><span aria-hidden="true" /> Active — business information attested</span>
              <span>Last confirmed {formatAttestedDate(profile.lastAttested)}</span>
            </div>
            <p>{profile.description}</p>
            <div className="button-row">
              <a className="button button-primary" href="#inquiry">Request a quotation <span aria-hidden="true">↓</span></a>
              {(!attestation || attestation.contactStates[profile.email] === "CURRENT") && <a className="text-link" href={`mailto:${profile.email}`}>{profile.email}</a>}
            </div>
          </div>
          <div className="business-mark" aria-hidden="true"><span>RH</span><i>Uganda · 2026</i></div>
        </section>

        <section className="trust-strip">
          <div className="shell trust-grid">
            <div><small>Information state</small><EvidenceBadge state={profile.evidenceState} /></div>
            <div><small>Primary workflow</small><strong>Request quotation</strong></div>
            <div><small>Agent support</small><strong>{webMcpStatus === "ready" ? "3 tools available" : webMcpStatus === "unsupported" ? "Human experience active" : "Checking WebMCP"}</strong></div>
            <div><small>Current offerings</small><strong>{currentProducts.length} listed</strong></div>
          </div>
        </section>

        <div className="shell profile-layout">
          <div className="profile-content">
            <section className="profile-section" aria-labelledby="products-heading">
              <div className="profile-section-heading"><div><p className="eyebrow">Current catalogue</p><h2 id="products-heading">Products confirmed for inquiry</h2></div><p>Availability and destination details are reconfirmed during quotation.</p></div>
              <div className="product-list">
                {currentProducts.map((product) => (
                  <article key={product.id} className="product-card">
                    <div className="product-card-top"><div><span className="product-id">{product.id}</span><h3>{product.name}</h3></div><span className={`product-status status-${product.status.toLocaleLowerCase()}`}>{productStatusLabel(product.status)}</span></div>
                    <p>{product.description}</p>
                    <dl>
                      <div><dt>Packaging</dt><dd>{product.packaging}</dd></div>
                      <div><dt>Minimum order</dt><dd>{product.moq}</dd></div>
                      <div><dt>Private label</dt><dd>{product.privateLabel ? "Available" : "Not offered"}</dd></div>
                      <div><dt>Evidence</dt><dd><EvidenceBadge state={product.evidenceState} /></dd></div>
                    </dl>
                    <button type="button" className="product-inquire" onClick={() => { updateField("productId", product.id); formRef.current?.scrollIntoView({ behavior: "smooth" }); }}>Inquire about this product <span aria-hidden="true">→</span></button>
                  </article>
                ))}
              </div>
            </section>

            <section className="profile-section capabilities-section" aria-labelledby="capabilities-heading">
              <div className="profile-section-heading"><div><p className="eyebrow">Business capabilities</p><h2 id="capabilities-heading">Prepared for B2B trade</h2></div></div>
              <ul className="capability-list">
                <li><span aria-hidden="true">✓</span><strong>Export inquiries</strong><small>Destination eligibility checked per product</small></li>
                <li><span aria-hidden="true">✓</span><strong>Product samples</strong><small>Subject to product and destination</small></li>
                <li><span aria-hidden="true">✓</span><strong>Private-label supply</strong><small>Available for selected formats</small></li>
                <li><span aria-hidden="true">✓</span><strong>Markets served</strong><small>{profile.capabilities.marketsServed.join(" · ")}</small></li>
              </ul>
            </section>

            <section className="profile-section inquiry-section" id="inquiry" aria-labelledby="inquiry-heading">
              <div className="inquiry-heading-row"><div><p className="eyebrow">Primary workflow</p><h2 id="inquiry-heading">Request a quotation</h2><p>Prepare with an agent or complete manually. Nothing is sent without your explicit approval.</p></div><div className={`webmcp-indicator status-${webMcpStatus}`}><span aria-hidden="true" />WebMCP {webMcpStatus}</div></div>

              {agentFields.size > 0 && (
                <div className="agent-prepared-banner" role="status"><span aria-hidden="true">✦</span><div><strong>Prepared by your agent — review before sending.</strong><p>Highlighted values came from the agent. Your edits are authoritative and remove the highlight.</p></div></div>
              )}

              <form ref={formRef} className="inquiry-form" onSubmit={submitManually} noValidate>
                <div className="field-grid two-column">
                  <label className={agentFields.has("productId") ? "agent-updated" : ""}>Product<span className="required">Required</span><select value={draft.productId} onChange={(event) => updateField("productId", event.target.value)} aria-invalid={Boolean(validation.errors.productId)}><option value="">Select a product</option>{profile.products.filter((product) => product.status === "CURRENTLY_AVAILABLE").map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select>{validation.errors.productId && <small className="field-error">{validation.errors.productId}</small>}</label>
                  <label className={agentFields.has("quantity") ? "agent-updated" : ""}>Quantity<span className="required">Required</span><input type="number" min="1" inputMode="numeric" value={draft.quantity} onChange={(event) => updateField("quantity", event.target.value)} placeholder="e.g. 5,000" aria-invalid={Boolean(validation.errors.quantity)} />{validation.errors.quantity && <small className="field-error">{validation.errors.quantity}</small>}</label>
                  <label className={agentFields.has("destinationCountry") ? "agent-updated" : ""}>Destination country<span className="required">Required</span><input value={draft.destinationCountry} onChange={(event) => updateField("destinationCountry", event.target.value)} placeholder="e.g. Japan" aria-invalid={Boolean(validation.errors.destinationCountry)} />{validation.errors.destinationCountry && <small className="field-error">{validation.errors.destinationCountry}</small>}</label>
                  <label className={agentFields.has("buyerCompany") ? "agent-updated" : ""}>Buyer company<span className="required">Required</span><input value={draft.buyerCompany} onChange={(event) => updateField("buyerCompany", event.target.value)} autoComplete="organization" aria-invalid={Boolean(validation.errors.buyerCompany)} />{validation.errors.buyerCompany && <small className="field-error">{validation.errors.buyerCompany}</small>}</label>
                  <label className={agentFields.has("buyerName") ? "agent-updated" : ""}>Your name<span className="required">Required</span><input value={draft.buyerName} onChange={(event) => updateField("buyerName", event.target.value)} autoComplete="name" aria-invalid={Boolean(validation.errors.buyerName)} />{validation.errors.buyerName && <small className="field-error">{validation.errors.buyerName}</small>}</label>
                  <label className={agentFields.has("buyerEmail") ? "agent-updated" : ""}>Business email<span className="required">Required</span><input type="email" value={draft.buyerEmail} onChange={(event) => updateField("buyerEmail", event.target.value)} autoComplete="email" aria-invalid={Boolean(validation.errors.buyerEmail)} />{validation.errors.buyerEmail && <small className="field-error">{validation.errors.buyerEmail}</small>}</label>
                  <div className="checkbox-field full-field">
                    <label className={agentFields.has("requestSamples") ? "agent-updated" : ""}><input type="checkbox" checked={draft.requestSamples} onChange={(event) => updateField("requestSamples", event.target.checked)} /><span aria-hidden="true" />Request samples</label>
                    <label className={agentFields.has("privateLabel") ? "agent-updated" : ""}><input type="checkbox" checked={draft.privateLabel} onChange={(event) => updateField("privateLabel", event.target.checked)} /><span aria-hidden="true" />Private-label packaging</label>
                  </div>
                  <label className={`full-field ${agentFields.has("questions") ? "agent-updated" : ""}`}>Questions or requirements<textarea rows={5} value={draft.questions} onChange={(event) => updateField("questions", event.target.value)} placeholder="Delivery timing, packaging, labelling, documentation…" maxLength={1000} /></label>
                </div>

                <div className="approval-panel">
                  <label className={!validation.valid ? "disabled" : ""}><input type="checkbox" checked={approved} disabled={!validation.valid || submissionState === "SUBMITTED"} onChange={(event) => setApproved(event.target.checked)} /><span className="approval-check" aria-hidden="true" /><span><strong>I have reviewed this inquiry and approve submission.</strong><small>Changing any field revokes approval and removes the submit tool.</small></span></label>
                  <div className="tool-lifecycle"><span className={submitToolAvailable ? "available" : "locked"} aria-hidden="true">{submitToolAvailable ? "✓" : "×"}</span><div><strong>submit_approved_inquiry</strong><small>{submitToolAvailable ? "Available to your agent" : "Locked until the form is valid and approved"}</small></div></div>
                </div>

                <div className="submission-row">
                  <button className="button button-primary" type="submit" disabled={!approved || !validation.valid || submissionState === "SUBMITTING" || submissionState === "SUBMITTED"}>{submissionState === "SUBMITTING" ? "Submitting…" : "Send approved inquiry"}</button>
                  <span className={`submission-state state-${visibleSubmissionState.toLocaleLowerCase().replaceAll(" ", "-")}`} role="status">{visibleSubmissionState === "DRAFT SAVED ON THIS DEVICE" && <span aria-hidden="true">✓</span>}{visibleSubmissionState}</span>
                </div>
                {submitError && <div className="submission-error" role="alert"><strong>Not submitted.</strong> {submitError} {submissionState === "SUBMISSION PENDING" && online && <button type="button" onClick={() => void performSubmit().catch(() => undefined)}>Retry now</button>}</div>}
                {receipt && <div className="submission-success" role="status"><span aria-hidden="true">✓</span><div><strong>Inquiry submitted</strong><p>Reference {receipt.reference}. The demo recorded no payment or binding order.</p></div></div>}
              </form>
            </section>

            <section className="profile-section source-section" aria-labelledby="source-heading">
              <div className="profile-section-heading"><div><p className="eyebrow">Source &amp; currentness</p><h2 id="source-heading">What “attested” means here</h2></div></div>
              <div className="source-grid"><article><EvidenceBadge state="OWNER_CONFIRMED" /><h3>Current business information</h3><p>A fictional demo representative confirmed the displayed identity, contact, product, and capability records on 26 August 2026.</p></article><article><EvidenceBadge state="LEGACY_SOURCE" /><h3>Legacy material stays separate</h3><p>Old pages can help recover candidate facts, but their contents never generate executable tool definitions or become current without review.</p></article></div>
              <p className="scope-note"><strong>Scope:</strong> Information Attestation confirms individual demo claims. It is not identity verification, KYC, a registry check, or a certification audit.</p>
            </section>
          </div>

          <aside className="profile-sidebar" aria-label="Continuity profile diagnostics">
            <section className="sidebar-card footprint-card">
              <div className="sidebar-heading"><div><p className="eyebrow">Observed in this browser</p><h2>Data Footprint</h2></div><span className="leaf-mark" aria-hidden="true">↓</span></div>
              <dl><div><dt>Transferred resources</dt><dd>{measurement.resources}</dd></div><div><dt>Observed transfer</dt><dd>{formatBytes(measurement.transferredBytes)}</dd></div><div><dt>Low-data mode</dt><dd>{lowData ? "On" : "Off"}</dd></div><div><dt>Cached / offline</dt><dd>{offlineProfileAvailable ? "Profile ready" : "Preparing"}</dd></div><div><dt>Draft state</dt><dd>{submissionState === "SUBMITTED" ? "Submitted" : draftPersistence === "saved" ? "Saved locally" : draftPersistence === "error" ? "Local save failed" : "Saving locally"}</dd></div></dl>
              <p className="measurement-note">Transfer values come from the browser Resource Timing API for this visit. A zero value can mean a cached resource or unavailable transfer detail; it is not an invented benchmark.</p>
            </section>

            <details className="sidebar-card activity-card" open>
              <summary><div><p className="eyebrow">Progressive enhancement</p><h2>Agent Activity</h2></div><span>{activity.length}</span></summary>
              <p className="activity-intro">A local explanation log. It avoids storing buyer field values.</p>
              {activity.length === 0 ? <div className="empty-activity"><span aria-hidden="true">◇</span><p>No WebMCP calls yet. The human experience remains fully available.</p></div> : <ol className="activity-list">{activity.map((entry) => <li key={entry.id}><span className={`activity-dot action-${entry.action}`} aria-hidden="true" /><div><div><code>{entry.tool}</code><time dateTime={entry.timestamp}>{new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit" }).format(new Date(entry.timestamp))}</time></div><p>{entry.summary}</p><small>{entry.readOnly ? "Read-only" : "State-changing"}{entry.approvalRequired ? " · Human approval required" : ""}</small></div></li>)}</ol>}
            </details>

            <section className="sidebar-card contact-card"><p className="eyebrow">Current contact</p><h2>Trade desk</h2>{(!attestation || attestation.contactStates[profile.email] === "CURRENT") && <a href={`mailto:${profile.email}`}>{profile.email}</a>}{(!attestation || attestation.contactStates[profile.phone] === "CURRENT") && <a href={`tel:${profile.phone.replaceAll(" ", "")}`}>{profile.phone}</a>}<small>Displayed contact items are owner-confirmed fictional demo records.</small></section>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
