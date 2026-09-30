/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse', 'mammoth', 'puppeteer-core', '@sparticuz/chromium-min', 'docx'],
  },
};

export default nextConfig;
