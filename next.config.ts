import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    "preview-chat-f0ef43a1-c9db-42ff-83fb-7c2734b5c3f3.space-z.ai",
    ".space-z.ai",
  ],
};

export default nextConfig;
