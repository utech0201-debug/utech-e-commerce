import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "UTECH Store",
    short_name: "UTECH Store",
    description: "Gaming systems, consoles, laptops, hardware and technology.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#0B1F3A",
    icons: [
      {
        src: "/favicon.png",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
