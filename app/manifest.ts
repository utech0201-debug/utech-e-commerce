import type { MetadataRoute } from "next";
import { marketplaceConfig } from "@/lib/marketplace-config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: marketplaceConfig.name,
    short_name: marketplaceConfig.name,
    description: marketplaceConfig.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#0B1F3A",
    icons: [
      {
        src: marketplaceConfig.logoUrl,
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
