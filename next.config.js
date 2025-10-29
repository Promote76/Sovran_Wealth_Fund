/** @type {import('next').NextConfig} */
const nextConfig = {
  // Simplest possible configuration
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  productionBrowserSourceMaps: false,
  swcMinify: false,
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig