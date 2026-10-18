import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const DEPLOY_BASE = process.env.DEPLOY_BASE ?? '/'

// https://vite.dev/config/
export default defineConfig({
  base: DEPLOY_BASE,
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'apple-touch-icon.png',
        'icon-192.png',
        'icon-512.png',
        'maskable-icon-512.png',
      ],
      manifest: {
        name: 'StreakPet',
        short_name: 'StreakPet',
        description: 'A lightweight, offline-first habit tracker with a virtual pet.',
        theme_color: '#f25c1f',
        background_color: '#faf7f4',
        display: 'standalone',
        start_url: DEPLOY_BASE,
        scope: DEPLOY_BASE,
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'maskable-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
    }),
  ],
})
