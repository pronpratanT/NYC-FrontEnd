/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      // GET user / deps → 6001
      {
        source: '/api/proxy/user/:path*',
        destination: 'http://127.0.0.1:6001/api/user/:path*',
      },
      {
        source: '/api/proxy/user/deps',
        destination: 'http://127.0.0.1:6001/api/user/deps',
      },

      // POST user login → 6001
      {
        source: '/api/proxy/user/login',
        destination: 'http://127.0.0.1:6001/api/user/login',
      },

      // PUT user login → 6001
      {
        source: '/api/proxy/user/login',
        destination: 'http://127.0.0.1:6001/api/user/UpdateIsActive',
      },

      // POST add-role → 6002
      {
        source: '/api/proxy/admin/:path*',
        destination: 'http://127.0.0.1:6002/api/admin/:path*',
      },

      // GET purchase -> 6100
      {
        source: '/api/proxy/purchase/search-part-no',
        destination: 'http://127.0.0.1:6100/api/purchase/search-part-no',
      },
      {
        source: '/api/proxy/purchase/search-pr',
        destination: 'http://127.0.0.1:6100/api/purchase/search-pr',
      },
      {
        source: '/api/proxy/purchase/search-vendor',
        destination: 'http://127.0.0.1:6100/api/purchase/search-vendor',
      },
      {
        source: '/api/proxy/purchase/request/departments',
        destination: 'http://127.0.0.1:6100/api/purchase/pr/request/departments',
      },
      {
        source: '/api/proxy/purchase/pc/compare/list',
        destination: 'http://127.0.0.1:6100/api/purchase/pc/compare/list',
      },
      {
        source: '/api/proxy/purchase/pr/compare/lists/last',
        destination: 'http://127.0.0.1:6100/api/purchase/pr/compare/lists/last',
      },
      // {
      //   source: '/api/proxy/purchase/request/list',
      //   destination: 'http://127.0.0.1:6100/api/purchase/pr/request/list',
      // },
      {
        source: '/api/purchase/:path*',
        destination: 'http://127.0.0.1:6100/api/purchase/:path*', // Proxy ไป backend
      },
    ];
  },
};

module.exports = nextConfig;
