import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import compression from 'vite-plugin-compression'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    compression({ algorithm: 'gzip', ext: '.gz', threshold: 1024 }),
    compression({ algorithm: 'brotliCompress', ext: '.br', threshold: 1024 }),
    VitePWA({
      // Switched from the default 'generateSW' strategy to 'injectManifest'.
      // With 'generateSW', vite-plugin-pwa writes its own sw.js from
      // scratch at build time - which silently overwrote public/sw.js
      // (the hand-written file with the push/notificationclick handlers
      // push notifications rely on), since both end up at the same output
      // path. The deployed service worker had no "push" listener at all,
      // so a subscribed user's push notifications never showed. With
      // 'injectManifest', vite-plugin-pwa instead takes public/sw.js as
      // the source, injects the Workbox precache list into it, and keeps
      // everything else - including the push handlers - intact.
      strategies: 'injectManifest',
      srcDir: 'public',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'robots.txt', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Emovra - Mental Wellness',
        short_name: 'Emovra',
        description: 'AI-powered emotional wellness support - Private, secure, caring',
        theme_color: '#0a0a0c',
        background_color: '#0a0a0c',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('chart.js')) {
              return 'charts'
            }
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor'
            }
            return 'vendor'
          }
        }
      }
    }
  }
})
