/** @type {import('next').NextConfig} */
const nextConfig = {
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
