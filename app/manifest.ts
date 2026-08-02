import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Stoxify - SEBI Compliant Research Analyst Platform",
    short_name: "Stoxify",
    description:
      "India's PaRRVA-aligned compliance infrastructure platform for SEBI-registered Research Analysts and verified trader marketplace.",
    start_url: "/",
    display: "standalone",
    background_color: "#0B111D",
    theme_color: "#0B111D",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/logo-icon.svg",
        sizes: "192x192",
        type: "image/svg+xml",
      },
    ],
  };
}
