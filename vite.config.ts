import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

import pkg from './package.json' with { type: 'json' };

export default defineConfig({
  base: './',
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg'],
      manifest: {
        name: 'Forja & Fortuna',
        short_name: 'Forja&Fortuna',
        description: 'Juego de gestión y RPG táctico: sos un herrero en un mundo de fantasía.',
        lang: 'es',
        display: 'fullscreen',
        orientation: 'landscape',
        background_color: '#1b1420',
        theme_color: '#1b1420',
        start_url: './',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,webmanifest}'],
        // Phaser va en un chunk grande; lo cacheamos igual para jugar offline.
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        // La música no entra en la carga inicial: cada tema se guarda la primera vez que suena.
        runtimeCaching: [{
          urlPattern: /\.(?:mp3|ogg|m4a)$/,
          handler: 'CacheFirst',
          options: { cacheName: 'musica', rangeRequests: true, cacheableResponse: { statuses: [200] } },
        }],
      },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 2500,
  },
});
