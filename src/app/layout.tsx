import type { Metadata, Viewport } from "next";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import { PreferenceHydrator } from "@/components/preference-hydrator";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "StillHere — Business continuity for the agentic web",
    template: "%s · StillHere",
  },
  description:
    "Recover conflicting business evidence, reconcile it through human review, and publish a versioned continuity surface for people and browser agents.",
  applicationName: "StillHere",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#f2efe7",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <PreferenceHydrator />
        <a className="skip-link" href="#main-content">Skip to main content</a>
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
