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
          <Link href="/assessment">Assessment</Link>
          <Link href="/recover">Attest</Link>
          <Link href="/business/rwenzori-harvest">Demo profile</Link>
        </nav>
      </div>
    </header>
  );
}
