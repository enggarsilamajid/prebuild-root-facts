import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: 'autoUpdate',

      includeAssets: [
        'favicon.ico',
        'apple-touch-icon.png',
        'icons/icon-192x192.png',
        'icons/icon-512x512.png',
      ],

      manifest: {
        name: 'RootFacts App',
        short_name: 'RootFacts',
        description: 'AI Vegetable Detection and Fun Facts',
        theme_color: '#16a34a',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },

      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,

        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,json,bin}',
        ],

        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.pathname.includes('/model/'),

            handler: 'CacheFirst',

            options: {
              cacheName: 'rootfacts-model-cache',

              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },

              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },

      devOptions: {
        enabled: true,
      },
    }),
  ],

  server: {
    port: 3001,
    host: true,
  },

  build: {
    sourcemap: false,
  },
});