import Link from "next/link";

export function SiteHeader({ compact = false }: { compact?: boolean }) {
  return (
    <header className={compact ? "site-header compact" : "site-header"}>
      <div className="shell header-inner">
        <Link className="wordmark" href="/" aria-label="StillHere home">
          <span aria-hidden="true" className="wordmark-mark">
            S
          </span>
          <span>StillHere</span>
        </Link>
        <nav aria-label="Primary navigation">
          <Link href="/assessment">Source recovery</Link>
          <Link href="/recover">Continuity Ledger</Link>
          <Link href="/business/rwenzori-harvest">Business Passport</Link>
        </nav>
      </div>
    </header>
  );
}
