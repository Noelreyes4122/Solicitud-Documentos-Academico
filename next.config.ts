import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'estudiantes.unphusist.unphu.edu.do' },
    ],
  },
}

export default nextConfig
