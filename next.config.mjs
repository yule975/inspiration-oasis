import path from 'path'

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    // 确保 @ 别名在构建时可用
    config.resolve.alias = config.resolve.alias || {}
    config.resolve.alias['@'] = path.resolve(process.cwd())
    return config
  },
}

export default nextConfig
