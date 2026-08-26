import { DemoResetControl } from "@/components/demo-reset-control";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div>
          <strong>StillHere</strong>
          <p>Business continuity infrastructure for the long tail of the web.</p>
        </div>
        <p className="demo-disclosure">
          Rwenzori Harvest Coffee Ltd and all related records are fictional
          demonstration data. No identity, legal status, or certification claim is
          made about a real business.
        </p>
        <DemoResetControl />
      </div>
    </footer>
  );
}
