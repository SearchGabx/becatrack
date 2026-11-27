import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdf-parse'],
  poweredByHeader: false, // no anuncia "X-Powered-By: Next.js"
  reactStrictMode: true,
  // Los PDF de horario y los CSV superan el límite de 1 MB por defecto de los Server Actions
  experimental: {
    serverActions: { bodySizeLimit: '10mb' },
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
