const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Do not advertise the runtime. Removes the `x-powered-by: Next.js` header.
  poweredByHeader: false,

  turbopack: {
    root: path.resolve(__dirname, '..'),
  },

  // Remote image policy. Keep this explicit, a wildcard here would let any
  // upstream host load through the Next/Image optimizer, which widens the
  // attack surface and counts toward Image Optimization quotas.
  images: {
    // Serve modern formats when the browser supports them. AVIF first (best
    // compression), WebP fallback.
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      // Local development only. Ignored in production because requests are HTTPS.
      { protocol: 'http',  hostname: 'localhost' },

      // Firebase Storage primary host for editor-uploaded blog assets.
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },

      // Google avatar URLs returned by Firebase Auth for admin sign-in.
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },

      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },

      // Cloudinary CDN — enabled when NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is set.
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },

      // Cloudflare Images CDN — enabled when NEXT_PUBLIC_CLOUDFLARE_IMAGES_ACCOUNT_HASH is set.
      {
        protocol: 'https',
        hostname: 'imagedelivery.net',
      },
    ],
  },

  // Security headers applied to every route.
  // CSP notes:
  //  - `https://apis.google.com` in `script-src` and `https://*.firebaseapp.com` +
  //    `https://accounts.google.com` in `frame-src` are required by Firebase Auth's
  //    `signInWithPopup(auth, GoogleAuthProvider)` flow; blocking them causes
  //    `Firebase: Error (auth/internal-error)`.
  //  - `Cross-Origin-Opener-Policy: same-origin-allow-popups` allows the OAuth
  //    popup window to postMessage the credential back to the opener window.
  async headers() {
    const isDev = process.env.NODE_ENV !== 'production'
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://apis.google.com https://*.firebaseapp.com https://www.gstatic.com`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "frame-src 'self' https://*.firebaseapp.com https://*.web.app https://accounts.google.com https://apis.google.com",
      [
        "img-src 'self' data: blob:",
        "https://firebasestorage.googleapis.com",
        "https://storage.googleapis.com",
        "https://lh3.googleusercontent.com",
        "https://*.supabase.co",
        "https://res.cloudinary.com",
        "https://imagedelivery.net",
        "https:",
      ].join(' '),
      [
        "connect-src 'self'",
        "https://*.googleapis.com",
        "https://*.google.com",
        "https://*.firebaseapp.com",
        "https://identitytoolkit.googleapis.com",
        "https://securetoken.googleapis.com",
        "wss://*.firebaseio.com",
        "https://*.firebaseio.com",
      ].join(' '),
      "media-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      ...(isDev ? [] : ["upgrade-insecure-requests"]),
    ].join('; ')

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy',    value: csp },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
          { key: 'X-Content-Type-Options',     value: 'nosniff' },
          { key: 'X-Frame-Options',            value: 'DENY' },
          { key: 'Referrer-Policy',            value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',         value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
          { key: 'X-DNS-Prefetch-Control',     value: 'on' },
          { key: 'Strict-Transport-Security',  value: 'max-age=63072000; includeSubDomains; preload' },
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
      { source: '/blog/admib',       destination: '/blog/admin',         permanent: false },
    ]
  },
}

module.exports = nextConfig
