import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "StillHere Business Continuity",
    short_name: "StillHere",
    description:
      "Human-agent continuity for reconciling evidence into a versioned Business Passport.",
    start_url: "/assessment",
    display: "standalone",
    background_color: "#f7f5ef",
    theme_color: "#173b2b",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
