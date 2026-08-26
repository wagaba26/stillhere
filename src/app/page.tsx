import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <section className="hero shell">
          <div className="hero-copy">
            <p className="eyebrow">A continuity layer for active businesses</p>
            <h1>The website may be outdated. The business isn&apos;t.</h1>
            <p className="hero-lede">
              Recover fragmented evidence, let an agent explain the conflicts,
              and keep the human in control of what becomes publishable and actionable.
            </p>
            <div className="button-row">
              <Link className="button button-primary" href="/assessment">
                Try Demo <span aria-hidden="true">→</span>
              </Link>
              <Link className="button button-secondary" href="/assessment">
                Check a business website
              </Link>
            </div>
            <p className="microcopy">No account. Fictional demo data. Under three minutes.</p>
          </div>
          <div className="continuity-visual" aria-label="Conflicting sources reconciled through a Continuity Ledger into a Business Passport">
            <article className="legacy-card">
              <div className="mock-browser-bar" aria-hidden="true"><i /><i /><i /></div>
              <p className="card-kicker">Recovered evidence</p>
              <strong>Sources disagree</strong>
              <dl>
                <div><dt>Legacy website</dt><dd>2021</dd></div>
                <div><dt>Catalogue</dt><dd>2023</dd></div>
                <div><dt>Recent evidence</dt><dd className="status-warn">Needs review</dd></div>
              </dl>
            </article>
            <div className="recovery-arrow ledger-bridge" aria-hidden="true"><span>Continuity</span><strong>Ledger</strong></div>
            <article className="continuity-card">
              <p className="card-kicker">Business Passport</p>
              <span className="active-pill">Representative attested</span>
              <strong>Accepted facts only</strong>
              <p>Human-readable. Agent-ready. Unresolved claims stay out.</p>
              <div className="signal-row" aria-label="Profile properties">
                <span>Owner confirmed</span><span>WebMCP</span><span>Low data</span>
              </div>
            </article>
          </div>
        </section>

        <section className="statement-band">
          <div className="shell narrow">
            <p className="statement-mark" aria-hidden="true">“</p>
            <h2>Making stale information machine-readable doesn&apos;t make it true.</h2>
            <p>
              AI agents increasingly use websites as sources of truth. StillHere
              puts currentness before automation.
            </p>
          </div>
        </section>

        <section className="section shell" id="how-it-works">
          <div className="section-heading">
            <p className="eyebrow">One careful sequence</p>
            <h2>Recover. Reconcile. Continue.</h2>
            <p>A continuity surface is useful only when its information has a clear source and a human remains in control.</p>
          </div>
          <p className="process-sequence" aria-label="Recover, Reconcile, Approve, Publish, Transact">Recover <span>→</span> Reconcile <span>→</span> Approve <span>→</span> Publish <span>→</span> Transact</p>
          <ol className="stage-grid">
            <li><span className="stage-number">01</span><h3>Recover evidence</h3><p>Separate website condition from business condition and retain conflicting sources as data—not instructions or truth.</p></li>
            <li><span className="stage-number">02</span><h3>Reconcile together</h3><p>An agent can group claims and stage explanations. A human accepts, edits, rejects, or leaves each claim unresolved.</p></li>
            <li><span className="stage-number">03</span><h3>Publish and act</h3><p>The accepted Passport powers the same public profile, agent search, and approval-gated business inquiry.</p></li>
          </ol>
        </section>

        <section className="section shell comparison-section">
          <div className="comparison-grid">
            <article>
              <p className="comparison-label">Existing approach</p>
              <h3>Make the old website easier for agents to operate.</h3>
              <p>The interaction improves, but the underlying information may still be stale, conflicting, or unsupported.</p>
            </article>
            <article className="comparison-stillhere">
              <p className="comparison-label">StillHere</p>
              <h3>Establish what is current, then expose a continuity surface.</h3>
              <p>Every important claim carries a currentness state. Consequential actions appear only after explicit human approval.</p>
            </article>
          </div>
          <p className="key-line">An agent-ready version of stale information is still stale information.</p>
        </section>

        <section className="section shell final-cta">
          <div><p className="eyebrow">See the complete flow</p><h2>From uncertain legacy page to a reviewed B2B inquiry.</h2></div>
          <Link className="button button-primary" href="/assessment">Start the demo <span aria-hidden="true">→</span></Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
