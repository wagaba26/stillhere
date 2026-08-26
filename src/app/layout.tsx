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
    "Recover what is still true, attest what is current, and publish a lightweight business continuity surface for humans and AI agents.",
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
