import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        pathname: "/utech0201-debug/utech-e-commerce/main/NarutoImages/**",
      },
    ],
  },
};

export default nextConfig;
