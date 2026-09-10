export default defineI18nConfig(() => ({
  legacy: false,
  fallbackLocale: 'en',
  // Surface missing keys in dev (parity audit), silence in production.
  missingWarn: import.meta.dev,
  fallbackWarn: import.meta.dev
}))
