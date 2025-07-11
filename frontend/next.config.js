const os = require('os');

// Collect all non-internal IPv4 addresses so developers can access the
// dev server from other machines on the network without seeing a warning.
function getLocalOrigins(port = 3000) {
  const origins = [];
  const interfaces = os.networkInterfaces();
  Object.values(interfaces).forEach((iface) => {
    (iface || []).forEach((addr) => {
      if (addr.family === 'IPv4' && !addr.internal) {
        origins.push(`http://${addr.address}:${port}`);
      }
    });
  });
  return origins;
}

const envOrigins = (process.env.ALLOWED_DEV_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    BACKEND_URL: process.env.BACKEND_URL,
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
    FRONTEND_URL: process.env.FRONTEND_URL,
    NEXT_PUBLIC_DISABLE_CRAFTJS: process.env.NEXT_PUBLIC_DISABLE_CRAFTJS,
  },
  experimental: {
    // Include origins from the environment variable and automatically
    // detected local network IPs to avoid cross-origin warnings.
    allowedDevOrigins: Array.from(new Set([...envOrigins, ...getLocalOrigins()])),
  },
};
module.exports = nextConfig;
