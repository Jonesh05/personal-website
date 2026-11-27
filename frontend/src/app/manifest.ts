import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Jhonny Pimiento — Senior Software & Web3 Engineer',
    short_name: 'jonesh.me',
    description:
      'Portfolio and technical blog of Jhonny Pimiento, Senior Software & Web3 Engineer specializing in blockchain, distributed systems, and cloud architecture.',
    start_url: '/',
    display: 'standalone',
    background_color: '#04080F',
    theme_color: '#04080F',
    icons: [
      {
        src: '/icon',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}
