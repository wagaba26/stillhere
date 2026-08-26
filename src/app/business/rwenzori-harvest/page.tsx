import type { Metadata } from "next";
import { business } from "@/domain/demo-data";
import { ProfileExperience } from "./profile-experience";

export const metadata: Metadata = {
  title: business.name,
  description: `${business.description} Attested business information last confirmed 26 August 2026.`,
};

export default function BusinessProfilePage() {
  return <ProfileExperience />;
}
