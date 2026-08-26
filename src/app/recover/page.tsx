import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { RecoveryWizard } from "./recovery-wizard";

export const metadata: Metadata = {
  title: "Information attestation",
  description: "Recover and attest current business information.",
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
