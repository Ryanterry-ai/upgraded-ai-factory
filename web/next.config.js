const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  webpack: (config, { isServer }) => {
    config.resolve.alias['@factory'] = path.resolve(__dirname, '../src');
    return config;
  },
};

module.exports = nextConfig;
