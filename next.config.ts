import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: { optimizePackageImports: ["@phosphor-icons/react", "@phosphor-icons/react/ssr"] },
};

export default nextConfig;
