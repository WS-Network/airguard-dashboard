import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  /* config options here */
  devIndicators: false,
  // Enable standalone output for Docker optimization
  output: 'standalone',
};
export default nextConfig;
