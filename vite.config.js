import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: 'autoUpdate',

      includeAssets: [
        'favicon.svg',
        'robots.txt',
      ],

      manifest: {
        name: 'RootFacts App',
        short_name: 'RootFacts',

        description:
          'AI Vegetable Detection and Fun Facts App',

        theme_color: '#16a34a',

        background_color: '#ffffff',

        display: 'standalone',

        start_url: '/',

        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },

      workbox: {
        cleanupOutdatedCaches: true,

        clientsClaim: true,

        skipWaiting: true,

        maximumFileSizeToCacheInBytes:
          10 * 1024 * 1024,

        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,json}',
        ],
      },

      devOptions: {
        enabled: false,
      },
    }),
  ],

  server: {
    port: 3001,
    host: true,
  },
});