import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '54321',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '54321',
      },
      {
        protocol: 'https',
        hostname: 'pub-a4da0d98ef494fbc968a352d6f9f5659.r2.dev',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
};

export default nextConfig;
