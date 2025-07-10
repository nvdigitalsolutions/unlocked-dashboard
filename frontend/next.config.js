/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    BACKEND_URL: process.env.BACKEND_URL,
  },
  experimental: {
    // Allow multiple origins in development, separated by commas in
    // the ALLOWED_DEV_ORIGIN environment variable. This prevents
    // cross-origin warnings when accessing the dev server from other
    // machines on the network.
    allowedDevOrigins: (process.env.ALLOWED_DEV_ORIGIN || 'http://localhost:3000')
      .split(',')
      .map((origin) => origin.trim()),
  },
};
module.exports = nextConfig;
