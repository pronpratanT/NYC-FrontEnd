const legacyBaseUrl = process.env.NEXT_PUBLIC_LEGACY_BASE_URL || "http://192.168.2.139:3000";

module.exports = {
  async rewrites() {
    return [
      {
        source: '/:path*',
        destination: `${legacyBaseUrl}/:path*`,
      },
    ];
  },
};
