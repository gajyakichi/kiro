import type { NextConfig } from "next";
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  /* config options here */
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  // Optimization: Split chunks more aggressively if needed, 
  // but Next.js defaults are usually quite good.
  experimental: {
    // If we wanted to really push it:
    // optimizePackageImports: ['lucide-react', '@mantine/core'],
    optimizePackageImports: [
      'lucide-react', 
      '@blocknote/mantine', 
      '@blocknote/react', 
      '@blocknote/core',
      '@mantine/core',
      '@mantine/hooks',
      '@phosphor-icons/react',
    ],
  },
};

export default withBundleAnalyzer(nextConfig);

