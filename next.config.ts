import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['*.ngrok-free.app'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Allow images from any secure host
      },
      {
        protocol: 'http',
        hostname: '**', // Allow images from any host (useful for some test data)
      },
    ],
    unoptimized: true, // Optional: helpful if you have many large external images
  },
};

export default nextConfig;
