import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  serverRuntimeConfig: {
    API_URL: process.env.API_URL
  }
}

export default nextConfig