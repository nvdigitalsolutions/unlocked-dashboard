/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    BACKEND_URL: process.env.BACKEND_URL,
  },
  experimental: {
    allowedDevOrigins: [process.env.ALLOWED_DEV_ORIGIN || 'http://localhost:3000'],
  },
};
module.exports = nextConfig;
