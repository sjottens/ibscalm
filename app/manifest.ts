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
    background_color: "#fff7f0",
    theme_color: "#1b2b48",
    lang: "nl",
    categories: ["health", "lifestyle"],
    icons: [
      { src: "/logos/android-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/logos/icon-rounded-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/logos/app-icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/logos/app-icon-1024.png", sizes: "1024x1024", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Vandaag", url: "/vandaag" },
      { name: "Inzichten", url: "/inzichten" },
    ],
  };
}
