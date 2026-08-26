import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { RecoveryWizard } from "./recovery-wizard";

export const metadata: Metadata = {
  title: "Continuity Ledger",
  description:
    "Reconcile recovered business evidence through agent proposals and human decisions.",
};

export default function RecoverPage() {
  return (
    <>
      <SiteHeader compact />
      <main id="main-content" className="page-main">
        <RecoveryWizard />
      </main>
      <SiteFooter />
    </>
  );
}
