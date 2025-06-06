/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  basePath: process.env.NODE_ENV === 'production' ? '/incr' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/incr/' : '',
}

module.exports = nextConfig