/** @type {import('next').NextConfig} */
// basePath must start with / (path only); assetPrefix can be full URL
const basePathEnv = process.env.NEXT_PUBLIC_BASE_PATH || '';
let basePath = basePathEnv;
if (basePathEnv.startsWith('http')) {
  try { basePath = new URL(basePathEnv).pathname.replace(/\/$/, ''); } catch { basePath = ''; }
}
const nextConfig = {
  basePath: basePath || '',
  assetPrefix: basePathEnv || '',
  images: {},
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
