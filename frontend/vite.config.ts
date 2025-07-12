import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { createHtmlPlugin } from 'vite-plugin-html'
import { visualizer } from 'rollup-plugin-visualizer'
import compression from 'vite-plugin-compression'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isProduction = mode === 'production'
  
  return {
    plugins: [
      react({
        // Optimize React imports in production
        jsxImportSource: isProduction ? '@emotion/react' : undefined,
      }),
      createHtmlPlugin({
        inject: {
          data: {
            nonce: isProduction ? 'CSP_NONCE_PLACEHOLDER' : '',
            title: env.VITE_APP_TITLE || 'Adaptive Learning Platform',
            description: env.VITE_APP_DESCRIPTION || 'AI-powered adaptive learning platform'
          }
        }
      }),
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json,txt,woff2,webmanifest}'],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          runtimeCaching: [
            // API calls - Network First with background sync
            {
              urlPattern: /^https:\/\/api\.ebrovalley\.digital\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache-v1',
                networkTimeoutSeconds: 10,
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
                },
                cacheableResponse: {
                  statuses: [0, 200, 206]
                },
                backgroundSync: {
                  name: 'api-background-sync',
                  options: {
                    maxRetentionTime: 24 * 60 // 24 hours
                  }
                }
              }
            },
            // Analytics data - Stale While Revalidate
            {
              urlPattern: /\/api\/analytics\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'analytics-cache-v1',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 4 // 4 hours
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            // Static assets - Cache First
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache-v1',
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 365 days
                }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-static-v1',
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 365 days
                }
              }
            },
            // Images with intelligent caching
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif|ico)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'images-cache-v1',
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 60 * 60 * 24 * 90 // 90 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            // CDN resources
            {
              urlPattern: /^https:\/\/cdnjs\.cloudflare\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'cdn-cache-v1',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 365 days
                }
              }
            }
          ]
        },
        manifest: {
          name: 'Adaptive Learning Platform - EbroValley Digital',
          short_name: 'EduLearn',
          description: 'Plataforma empresarial de aprendizaje adaptativo con IA. Revoluciona tu educación con tecnología de vanguardia.',
          theme_color: '#2563eb',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          categories: ['education', 'productivity', 'business'],
          lang: 'es-ES',
          shortcuts: [
            {
              name: 'Dashboard Principal',
              short_name: 'Dashboard',
              description: 'Acceso directo al panel de control principal',
              url: '/?page=dashboard',
              icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
            },
            {
              name: 'Diagnóstico Rápido',
              short_name: 'Diagnóstico',
              description: 'Realizar evaluación diagnóstica inmediata',
              url: '/?page=diagnostic',
              icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
            },
            {
              name: 'Evaluación',
              short_name: 'Evaluación',
              description: 'Acceso directo a evaluaciones y pruebas',
              url: '/?page=assessment',
              icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
            }
          ],
          screenshots: [
            {
              src: 'screenshot-desktop.png',
              sizes: '1280x720',
              type: 'image/png',
              form_factor: 'wide',
              label: 'Dashboard principal en escritorio'
            },
            {
              src: 'screenshot-mobile.png',
              sizes: '750x1334',
              type: 'image/png',
              form_factor: 'narrow',
              label: 'Vista móvil del dashboard'
            }
          ],
          icons: [
            {
              src: 'favicon.ico',
              sizes: '48x48',
              type: 'image/x-icon'
            },
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ],
          // Advanced PWA features
          protocol_handlers: [
            {
              protocol: 'web+edulearn',
              url: '/?handler=%s'
            }
          ],
          // Share target for receiving content
          share_target: {
            action: '/share',
            method: 'POST',
            enctype: 'multipart/form-data',
            params: {
              title: 'title',
              text: 'text',
              url: 'url',
              files: [
                {
                  name: 'file',
                  accept: ['image/*', 'application/pdf', '.doc', '.docx']
                }
              ]
            }
          },
          // Related applications
          related_applications: [
            {
              platform: 'webapp',
              url: 'https://ebrovalley.digital/adaptive-learning'
            }
          ],
          prefer_related_applications: false
        },
        devOptions: {
          enabled: !isProduction
        }
      }),
      // Gzip and Brotli compression
      compression({
        algorithm: 'gzip',
        ext: '.gz'
      }),
      compression({
        algorithm: 'brotliCompress',
        ext: '.br',
        threshold: 1024
      }),
      // Bundle analyzer for production builds
      isProduction && visualizer({
        filename: 'dist/bundle-analysis.html',
        open: false,
        gzipSize: true,
        brotliSize: true
      })
    ].filter(Boolean),
    
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@components': resolve(__dirname, 'src/components'),
        '@pages': resolve(__dirname, 'src/pages'),
        '@hooks': resolve(__dirname, 'src/hooks'),
        '@services': resolve(__dirname, 'src/services'),
        '@utils': resolve(__dirname, 'src/utils'),
        '@types': resolve(__dirname, 'src/types'),
        '@assets': resolve(__dirname, 'src/assets')
      }
    },
    
    build: {
      target: 'es2020',
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: isProduction ? false : true,
      minify: isProduction ? 'terser' : false,
      
      // Optimize chunk splitting
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks
            'react-vendor': ['react', 'react-dom'],
            'ui-vendor': ['lucide-react'],
            
            // Feature chunks
            'gdpr': [
              './src/components/gdpr/CookieConsent.tsx',
              './src/components/gdpr/UserRightsManager.tsx',
              './src/services/gdpr.service.ts'
            ],
            'analytics': [
              './src/components/Analytics/BusinessIntelligenceDashboard.tsx',
              './src/services/analyticsService.ts'
            ]
          },
          
          // Optimize asset naming
          chunkFileNames: (chunkInfo) => {
            const name = chunkInfo.name
            return `js/${name}-[hash].js`
          },
          entryFileNames: 'js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            if (!assetInfo.name) return `assets/[name]-[hash][extname]`
            
            const info = assetInfo.name.split('.')
            const ext = info[info.length - 1]
            
            if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)$/.test(assetInfo.name)) {
              return `media/[name]-[hash].${ext}`
            }
            if (/\.(png|jpe?g|gif|svg|webp|avif)$/.test(assetInfo.name)) {
              return `images/[name]-[hash].${ext}`
            }
            if (/\.(woff2?|eot|ttf|otf)$/.test(assetInfo.name)) {
              return `fonts/[name]-[hash].${ext}`
            }
            return `assets/[name]-[hash].${ext}`
          }
        }
      },
      
      // Terser options for production minification
      terserOptions: isProduction ? {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug'],
          passes: 2
        },
        mangle: {
          safari10: true
        },
        format: {
          comments: false
        }
      } : {},
      
      // Asset optimization
      assetsInlineLimit: 4096, // 4kb
      cssCodeSplit: true,
      cssMinify: isProduction,
      
      // Build performance
      chunkSizeWarningLimit: 1000, // 1MB
      reportCompressedSize: false // Faster builds
    },
    
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'lucide-react',
        'clsx',
        'tailwind-merge'
      ],
      exclude: [
        'vite-plugin-pwa/pwa-assets'
      ]
    },
    
    server: {
      port: 3000,
      host: true,
      open: false,
      cors: true,
      
      // Development proxy
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:4000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, '/api/v1')
        }
      },
      
      // Development optimizations
      hmr: {
        overlay: true
      }
    },
    
    preview: {
      port: 4173,
      host: true,
      cors: true
    },
    
    // Performance optimizations
    esbuild: {
      target: 'es2020',
      logOverride: { 'this-is-undefined-in-esm': 'silent' }
    },
    
    // CSS optimizations
    css: {
      devSourcemap: !isProduction,
      preprocessorOptions: {
        scss: {
          charset: false
        }
      }
    }
  }
})
