import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${BRAND.name} — PDS-dagboek`,
    short_name: BRAND.name,
    description: "Houd eten, klachten, stress en slaap bij. Alles blijft op je toestel.",
    id: "/vandaag",
    start_url: "/vandaag",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f6f1e7",
    theme_color: "#f6f1e7",
    lang: "nl",
    categories: ["health", "lifestyle"],
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Vandaag", url: "/vandaag" },
      { name: "Inzichten", url: "/inzichten" },
    ],
  };
}
