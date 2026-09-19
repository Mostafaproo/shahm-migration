import {
  createSettingsGate,
  emptyTenantSettings,
  normalizeTenantSettings,
  resolveActiveDomain,
  type TenantSettings,
  type TenantSettingsResponse
} from '~/core/http'

function isTenantApiUrl(url: string, tenantApiBase: string): boolean {
  if (!tenantApiBase) return false
  try {
    if (!/^https?:\/\//i.test(url)) return true
    return new URL(url).origin === new URL(tenantApiBase).origin
  } catch {
    return false
  }
}

const SUPPORTED_LOCALES = ['en', 'ar'] as const

function resolveLocaleFromPath(pathname: string): string {
  const first = pathname.split('/').filter(Boolean)[0]
  return (SUPPORTED_LOCALES as readonly string[]).includes(first ?? '') ? first! : 'ar'
}

function resolveRequestUrl(request: unknown, options: { baseURL?: string }): string {
  const raw
    = typeof request === 'string'
      ? request
      : request instanceof Request
        ? request.url
        : String(request ?? '')
  if (/^https?:\/\//i.test(raw)) return raw
  const base = (options.baseURL ?? '').replace(/\/$/, '')
  if (!base) return raw
  return `${base}/${raw.replace(/^\//, '')}`
}

export default defineNuxtPlugin({
  name: 'settings-bootstrap',
  enforce: 'pre',
  async setup() {
    const config = useRuntimeConfig()
    const event = useRequestEvent()

    // Prefer Host header / location.host so local `:port` is preserved then stripped.
    const host = import.meta.server
      ? (event?.node.req.headers.host ?? '')
      : window.location.host
    const pathname = import.meta.server ? (event?.path ?? '/') : window.location.pathname
    const locale = resolveLocaleFromPath(pathname)

    const gate = createSettingsGate(async (domainFromUrl) => {
      const tenantBaseDomain = config.public.TENANT_BASE_DOMAIN as string
      if (!tenantBaseDomain) throw new Error('TENANT_BASE_DOMAIN is not configured')

      const activeDomain
        = (config.public.SETTINGS_DOMAIN as string | undefined)?.trim()
          || domainFromUrl
      // The endpoint answers with a JSON:API envelope; flatten it once here so
      // no consumer has to walk `data.attributes` or parse "false" strings.
      const response = await $fetch<TenantSettingsResponse>(
        `${tenantBaseDomain}/api/v1/${locale}/tenant?domain=${encodeURIComponent(activeDomain)}`,
        { headers: { 'Content-Type': 'application/vnd.api+json', 'Accept': 'application/vnd.api+json' } }
      )
      return normalizeTenantSettings(response)
    })

    let settings: TenantSettings
    try {
      settings = await gate.ensure(host)
    } catch (err) {
      const activeDomain = resolveActiveDomain(host)

      console.warn(
        '[settings] gate failed, using fallback tenant:',
        (err as Error)?.message ?? err
      )
      settings = {
        ...emptyTenantSettings(),
        settingsId: `dev-tenant-${activeDomain || 'local'}`
      }
    }

    if (import.meta.client) {
      const overrides: Record<string, string> = {}
      if (settings.theme.website_primary_color) overrides['ui-primary'] = settings.theme.website_primary_color
      if (settings.theme.website_secondary_color) overrides['ui-secondary'] = settings.theme.website_secondary_color
      if (Object.keys(overrides).length) gate.applyTheme(overrides)
    }

    globalThis.$fetch = $fetch.create({
      onRequest({ request, options }) {
        const headers = new Headers(options.headers as HeadersInit)
        const url = resolveRequestUrl(request, options as { baseURL?: string })
        const needsTenantHeader = isTenantApiUrl(url, settings.env.BASE_URL ?? '')

        if (settings.settingsId && needsTenantHeader) {
          headers.set('X-Tenant-ID', settings.settingsId)
        } else {
          headers.delete('X-Tenant-ID')
          headers.delete('x-tenant-id')
        }

        options.headers = headers
      }
    })

    return { provide: { tenant: settings } }
  }
})
