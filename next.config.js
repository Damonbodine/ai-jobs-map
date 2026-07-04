/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
    ],
  },
  reactStrictMode: true,
  async redirects() {
    return [
      // Vercel does not auto-redirect the .vercel.app alias once a custom
      // domain is primary — without this, the old URL keeps serving duplicate
      // content (bad for SEO and split analytics).
      {
        source: "/:path*",
        has: [{ type: "host", value: "ai-jobs-map.vercel.app" }],
        destination: "https://timeback.clearroadlabs.com/:path*",
        permanent: true,
      },
    ]
  },
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
