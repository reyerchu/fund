/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
  },
  // 修復快取問題 - 減少快取時間
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
