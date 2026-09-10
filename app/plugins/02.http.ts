
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
      onUnauthorized: () => auth.clear(),
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
