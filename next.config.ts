import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    domains: ['drive.google.com'],
  },
  serverExternalPackages: ['googleapis'],
};

export default nextConfig;
