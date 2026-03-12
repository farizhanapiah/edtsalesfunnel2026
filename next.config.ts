import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow React Email components to render server-side
  serverExternalPackages: ["@react-email/components", "@react-email/render"],

  images: {
    remotePatterns: [],
  },

  // Empty turbopack config to satisfy Next.js 16 Turbopack default
  turbopack: {},
};

export default nextConfig;
