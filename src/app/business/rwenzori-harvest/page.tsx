import type { Metadata } from "next";
import { business } from "@/domain/demo-data";
import { ProfileExperience } from "./profile-experience";

export const metadata: Metadata = {
  title: business.name,
  description: `${business.description} Fictional Business Passport demo with human-reviewed current offerings and an approval-gated WebMCP inquiry.`,
};

export default function BusinessProfilePage() {
  return <ProfileExperience />;
}
