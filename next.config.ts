import type { NextConfig } from "next";

// Only the public bucket used by the site editor may serve remote images.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");

const nextConfig: NextConfig = {
  images: {
    // 90 is reserved for the full-bleed hero, where 75 visibly softens skin texture.
    qualities: [75, 90],
    remotePatterns: supabaseUrl
      ? [new URL(`${supabaseUrl}/storage/v1/object/public/site-media/**`)]
      : [],
  },
  experimental: { optimizePackageImports: ["@phosphor-icons/react", "@phosphor-icons/react/ssr"] },
};

export default nextConfig;
