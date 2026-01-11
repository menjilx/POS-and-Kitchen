import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-a4da0d98ef494fbc968a352d6f9f5659.r2.dev',
      },
      {
        protocol: 'https',
        hostname: 'okvtephxpcacqzrmmcaw.supabase.co',
      },
    ],
  },
};

export default nextConfig;
