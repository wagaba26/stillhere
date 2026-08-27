import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { AssessmentExperience } from "./assessment-experience";

export const metadata: Metadata = {
  title: "Source recovery assessment",
  description:
    "Safely observe one public business webpage without confusing website condition with business condition.",
};

export default function AssessmentPage() {
  return (
    <>
      <SiteHeader compact />
      <main id="main-content" className="page-main" tabIndex={-1}>
        <AssessmentExperience />
      </main>
      <SiteFooter />
    </>
  );
}
