// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from 'url'

export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },

  // Modules
  modules: [], // ['@nuxtjs/i18n'],

  // i18n configuration
  /*
  i18n: {
    locales: [
      { code: 'en', name: 'English', file: 'en.json' },
      { code: 'es', name: 'Español', file: 'es.json' },
      { code: 'zh', name: '中文', file: 'zh.json' },
      { code: 'id', name: 'Bahasa Indonesia', file: 'id.json' },
    ],
    defaultLocale: 'en',
    lazy: true,
    langDir: 'locales',
    strategy: 'no_prefix',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_locale',
      fallbackLocale: 'en',
    },
  },
  */

  // Nitro server configuration
  nitro: {
    experimental: {
      openAPI: true,
    },
    alias: {
      '~/server': fileURLToPath(new URL('./server', import.meta.url)),
    },
  },

  // Runtime configuration
  runtimeConfig: {
    // Private keys (server-side only)
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production',
    jwtExpiration: '15m',
    jwtRefreshExpiration: '7d',

    // Database
    databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/saas_starter',

    // SSO (server-side only)
    sso: {
      clientSecret: process.env.SSO_CLIENT_SECRET || '',
    },

    // Public keys (exposed to client)
    public: {
      appName: 'SaaS Starter',
      apiBase: '/api/v1',
      sso: {
        baseUrl: process.env.SSO_BASE_URL || 'https://sso.yourdomain.com',
        clientId: process.env.SSO_CLIENT_ID || '',
        redirectUri: process.env.SSO_REDIRECT_URI || 'http://localhost:3000/auth/callback',
        scopes: ['openid', 'profile', 'email'],
      },
    },
  },

  // TypeScript configuration
  typescript: {
    strict: true,
    typeCheck: false,
  },

  // Build optimizations for Naive UI
  build: {
    transpile: ['naive-ui', '@css-render/vue3-ssr'],
  },
})
