import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  output: 'standalone', // genera .next/standalone con solo lo necesario para correr en Docker
  outputFileTracingRoot: path.join(__dirname),
  serverExternalPackages: ['pdf-parse'],
  poweredByHeader: false, // no anuncia "X-Powered-By: Next.js"
  reactStrictMode: true,
  // Los PDF de horario y los CSV superan el límite de 1 MB por defecto de los Server Actions
  experimental: { serverActions: { bodySizeLimit: '10mb' } },
};

export default nextConfig;
