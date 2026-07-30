import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Vercel builds and deploys the app itself — no "standalone" output needed. */
  typescript: {
    // Real type errors have been fixed; keep the build honest going forward.
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
};

export default nextConfig;
