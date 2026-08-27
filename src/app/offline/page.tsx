import Link from "next/link";

export default function OfflinePage() {
  return (
    <main id="main-content" className="offline-page" tabIndex={-1}>
      <div className="offline-card">
        <span className="wordmark-mark" aria-hidden="true">S</span>
        <p className="eyebrow">Connection unavailable</p>
        <h1>You&apos;re offline.</h1>
        <p>
          A previously loaded business profile may still be available. Inquiry
          drafts stay on this device and are never marked submitted without a
          successful network response.
        </p>
        <Link className="button button-primary" href="/business/rwenzori-harvest">
          Try cached demo profile
        </Link>
      </div>
    </main>
  );
}
