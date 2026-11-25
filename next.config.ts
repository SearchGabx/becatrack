import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  output: 'standalone', // genera .next/standalone con solo lo necesario para correr en Docker
  outputFileTracingRoot: path.join(__dirname),
  serverExternalPackages: ['pdf-parse'],
  poweredByHeader: false, // no anuncia "X-Powered-By: Next.js"
  reactStrictMode: true,
};

export default nextConfig;
