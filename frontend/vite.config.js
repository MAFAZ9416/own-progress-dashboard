import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      strategies: 'generateSW',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        importScripts: ['/sw-push-listener.js'],
        // Exclude authentication and mutate endpoints from caching
        navigateFallbackDenylist: [
          /^\/api\/users\/login/,
          /^\/api\/users\/register/,
          /^\/api\/users\/logout/,
          /^\/api\/token\/refresh/,
          /^\/api\/users\/profile/
        ],
        runtimeCaching: [
          {
            // Do NOT cache authentication POST/PUT/DELETE requests or mutation endpoints
            urlPattern: /\/api\/.*(login|register|logout|refresh|profile)/,
            handler: 'NetworkOnly',
            method: 'POST'
          },
          {
            // Network First for analytical, health, tasks, skills, and notification query endpoints
            urlPattern: ({ url }) => {
              const isApi = url.pathname.startsWith('/api/')
              const isAuthOrMutation = url.pathname.includes('/login') || 
                                       url.pathname.includes('/register') || 
                                       url.pathname.includes('/logout') || 
                                       url.pathname.includes('/refresh') ||
                                       url.pathname.includes('/profile')
              return isApi && !isAuthOrMutation
            },
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-data-cache',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 24 * 60 * 60 // 1 day
              },
              cacheableResponse: {
                statuses: [200]
              }
            }
          },
          {
            // Cache First for frontend static assets: js, css, woff2 fonts, images, icons
            urlPattern: /\.(?:js|css|woff2|png|jpg|jpeg|svg|gif|ico)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-assets-cache',
              expiration: {
                maxEntries: 150,
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      manifest: {
        name: "Progressly – Own Progress Dashboard",
        short_name: "Progressly",
        description: "Personal Learning & Productivity Dashboard",
        theme_color: "#7c3aed",
        background_color: "#0f1021",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        lang: "en",
        categories: ["productivity", "education", "business"],
        icons: [
          {
            src: "/icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png"
          },
          {
            src: "/icons/icon-192x192-maskable.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable"
          },
          {
            src: "/icons/icon-512x512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('recharts')) return 'recharts'
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-router-dom/')
          ) {
            return 'vendor'
          }
        },
      },
    },
  },
})
