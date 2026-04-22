const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Do not advertise the runtime. Removes the `x-powered-by: Next.js` header.
  poweredByHeader: false,

  turbopack: {
    root: path.resolve(__dirname, '..'),
  },

  // Remote image policy. Keep this explicit — a wildcard here would let any
  // upstream host load through the Next/Image optimizer, which widens the
  // attack surface and counts toward Image Optimization quotas.
  images: {
    remotePatterns: [
      // Local development only. Ignored in production because requests are HTTPS.
      { protocol: 'http',  hostname: 'localhost' },

      // Firebase Storage — primary host for editor-uploaded blog assets.
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },

      // Google avatar URLs returned by Firebase Auth for admin sign-in.
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },

  // Security headers applied to every route. Keep this set minimal and
  // production-safe — a broken CSP here would be invisible in local dev and
  // silently break prod, so CSP is intentionally omitted until it is
  // validated end-to-end.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options',    value: 'nosniff' },
          { key: 'X-Frame-Options',           value: 'DENY' },
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
          { key: 'X-DNS-Prefetch-Control',    value: 'on' },
          // HSTS is a no-op over HTTP (localhost dev), so it's safe to always emit.
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ]
  },

  // Keep footer / legacy links working without creating duplicate pages.
  // All of these surface the user to the single canonical location for
  // the requested content. 308 (permanent: true) is SEO-friendly.
  async redirects() {
    return [
      { source: '/contact',          destination: '/#contact',           permanent: true },
      { source: '/blog/tutorials',   destination: '/blog?tag=tutorials', permanent: true },
      { source: '/blog/notes',       destination: '/blog?tag=notes',     permanent: true },
    ]
  },
}

module.exports = nextConfig
