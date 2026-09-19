import { createHttpClient } from '~/core/http'
import { useAuthStore } from '../stores/auth'

export default defineNuxtPlugin({
  name: 'http-client',
  setup() {
    const auth = useAuthStore()
    const tenant = useTenant()
    const runtimeConfig = useRuntimeConfig()
    const nuxtApp = useNuxtApp()
    const client = createHttpClient({
      getToken: () =>
        auth.token || useCookie<string | null>('shaham_session').value,
      BASE_API_URL: tenant.env.BASE_URL || (runtimeConfig.public.BASE_API_URL as string) || undefined,
      onUnauthorized: () => {
        if (!import.meta.client) return
        auth.clear()

        const { $i18n, $localePath } = nuxtApp as unknown as {
          $i18n?: { localeCodes?: unknown }
          $localePath?: (path: string) => string
        }

        const localeCodes: string[] = (unref($i18n?.localeCodes) as string[]) ?? []
        const currentPath = useRoute().path
        const [first = '', ...rest] = currentPath.split('/').filter(Boolean)
        const path = localeCodes.includes(first) ? `/${rest.join('/')}` : currentPath
        if (path === '/auth' || path.startsWith('/auth/')) return

        void navigateTo(
          $localePath ? $localePath('/auth/login') : '/auth/login',
          { replace: true }
        )
      },
      headers: () => {
        const locale = unref(
          (nuxtApp.$i18n as { locale?: unknown } | undefined)?.locale
        )
        return {
          'Accept': 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
          ...(locale ? { 'Accept-Language': String(locale) } : {})
        }
      }
    })

    return { provide: { http: client } }
  }
})
