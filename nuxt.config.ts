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

  app: {
    pageTransition: { name: 'page', mode: 'out-in' }
  },

  css: ['~/assets/css/main.css'],

  colorMode: {
    classSuffix: '',
    preference: 'light',
    fallback: 'light'
  },

  runtimeConfig: {
    public: {
      BASE_API_URL: process.env.BASE_API_URL || '',
      // WIRIS (the CKEditor maths plugin) licence key. Unlicensed-free on
      // localhost; a real domain needs it. Same default as the monorepo, whose
      // editor this one is ported from.
      CKEDITOR_KEY: process.env.CKEDITOR_KEY || 'Z3C7XDRA',
      TENANT_BASE_DOMAIN: process.env.TENANT_BASE_DOMAIN || '',
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
