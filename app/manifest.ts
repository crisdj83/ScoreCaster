import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'XactScore',
    short_name: 'XactScore',
    description: 'Predict match scores and compete with friends.',
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#050506',
    theme_color: '#050506',
    lang: 'en',
    categories: ['sports', 'games'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
