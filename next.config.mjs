/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Next.js would otherwise add AGENTS.md / CLAUDE.md files to the project on the first `npm run dev`.
  agentRules: false,
  // To open `npm run dev` from a phone on the same Wi-Fi: DEV_ORIGINS=192.168.1.20 npm run dev
  allowedDevOrigins: process.env.DEV_ORIGINS ? process.env.DEV_ORIGINS.split(',') : undefined,
  async headers() {
    // A private letter: keep it out of search indexes.
    return [
      {
        source: '/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },
};

export default nextConfig;
