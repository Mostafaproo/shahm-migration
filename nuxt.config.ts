// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@pinia/nuxt',
    '@nuxtjs/i18n'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  colorMode: {
    classSuffix: '',
    preference: 'light',
    fallback: 'light'
  },

  runtimeConfig: {
    public: {
      // Fallback base URL for the shared http client (app/core/http/client.ts)
      // — only used when the tenant lookup hasn't resolved yet or didn't
      // return an `env.BASE_URL` (see app/plugins/02.http.ts, which prefers
      // the per-tenant URL since every school has its own API subdomain).
      BASE_API_URL: process.env.BASE_API_URL || '',
      // Base URL of the tenant-management service the settings-gate calls
      // (see app/plugins/01.settings.ts) — `${TENANT_BASE_DOMAIN}/api/v1/{locale}/tenant?domain=`.
      // Read directly from the bare `TENANT_BASE_DOMAIN` var in .env, same as
      // `SETTINGS_DOMAIN` below.
      TENANT_BASE_DOMAIN: process.env.TENANT_BASE_DOMAIN || '',
      // Overrides hostname-based tenant resolution — useful for local dev.
      // Read directly from the bare `SETTINGS_DOMAIN` var in .env (not the
      // `NUXT_PUBLIC_...` auto-mapped convention) since that's the name the
      // project's .env already uses.
      SETTINGS_DOMAIN: process.env.SETTINGS_DOMAIN || '',
      useMocks: false
    }
  },

  routeRules: {
    '/': { prerender: false }
  },

  devServer: {
    port: 5000
  },

  compatibilityDate: '2026-06-30',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  i18n: {
    defaultLocale: 'ar',
    strategy: 'prefix',
    detectBrowserLanguage: false,
    baseUrl: '/',
    locales: [
      { code: 'en', language: 'en-US', name: 'English', dir: 'ltr', file: 'en.ts' },
      { code: 'ar', language: 'ar-EG', name: 'العربية', dir: 'rtl', file: 'ar.ts' }
    ],
    vueI18n: './i18n.config.ts'
  }
})
