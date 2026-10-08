import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 90 is reserved for the full-bleed hero, where 75 visibly softens skin texture.
  images: { qualities: [75, 90] },
  experimental: { optimizePackageImports: ["@phosphor-icons/react", "@phosphor-icons/react/ssr"] },
};

export default nextConfig;
