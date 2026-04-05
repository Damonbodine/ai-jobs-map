/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
    ],
  },
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Exclude playwright artifacts from file watching
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/.playwright-mcp/**', '**/node_modules/**'],
    }
    return config
  },
}
module.exports = nextConfig;
