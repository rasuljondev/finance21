/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ['src'],
  },
  // Disable Next.js development indicators (removed deprecated options)
  async rewrites() {
    const backendUrl =
      process.env.NODE_ENV === "production"
        ? `http://localhost:${process.env.BACKEND_PORT || "3001"}`
        : `http://localhost:${process.env.BACKEND_PORT || "3001"}`;

    return [
      {
        source: "/api/backend/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;

