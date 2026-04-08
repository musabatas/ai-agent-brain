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
};

export default nextConfig;
