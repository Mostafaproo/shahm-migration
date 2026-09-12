/** School branding: titles, logo, brand colors. NOT theme design tokens. */
export interface TenantThemePayload {
  title?: string
  slogan?: string
  main_logo?: string
  background_image?: string
  favicon?: string
  website_primary_color?: string
  website_secondary_color?: string
  /** Stringified boolean — unlike `attributes.features`, see above. */
  read_only_mode?: string
}

export interface TenantSettingsAttributes {
  name: string
  domain: string
  /** Per-tenant service URLs; take precedence over runtimeConfig.public. */
  env: Record<string, string | null>
  theme: TenantThemePayload
  features: Record<string, boolean>
  privacy_policy?: string
  landing_slogan?: string
  landing_title?: string
}

export interface TenantSettingsResponse {
  data: {
    type: string
    id: string
    attributes: TenantSettingsAttributes
  }
}

// ── App shape — what $tenant exposes ────────────────────────────────────────

export interface TenantSettings {
  /** JSON:API resource id (e.g. "1") — the value stamped on X-Tenant-ID. */
  settingsId: string
  /** `attributes.name` — stable per-tenant key (e.g. "qdrat"). */
  tenantId: string
  /** `attributes.domain` — the tenant's own hostname. */
  domain: string
  /** School branding (title, logo, brand colors) — not a token map. */
  theme: TenantThemePayload
  /** `theme.main_logo`. */
  logo: string | null
  /** `theme.favicon`. */
  favicon: string | null
  env: Record<string, string | null>
  features: Record<string, boolean>
  /** Rich-text HTML fields the landing page renders as-is. */
  landingTitle: string | null
  landingSlogan: string | null
  privacyPolicy: string | null
  /** Parsed from `theme.read_only_mode`. */
  readOnlyMode: boolean
}

const TRUTHY_FLAGS = new Set(['1', 'true', 'yes', 'on', 'enabled'])

export function parseSettingsFlag(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value !== 'string') return false
  return TRUTHY_FLAGS.has(value.trim().toLowerCase())
}

function toRecord<T = string | null>(value: unknown): Record<string, T> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, T>
}

/** Empty-but-valid settings — the shape every consumer can read without guards. */
export function emptyTenantSettings(): TenantSettings {
  return {
    settingsId: '',
    tenantId: '',
    domain: '',
    theme: {},
    logo: null,
    favicon: null,
    env: {},
    features: {},
    landingTitle: null,
    landingSlogan: null,
    privacyPolicy: null,
    readOnlyMode: false
  }
}

/**
 * Flatten the JSON:API envelope into the app shape. Tolerates a partial
 * payload: anything missing falls back to the empty value rather than
 * throwing mid-bootstrap.
 */
export function normalizeTenantSettings(
  response: TenantSettingsResponse | null | undefined
): TenantSettings {
  const resource = response?.data
  const attributes = resource?.attributes
  const theme = attributes?.theme ?? {}

  return {
    ...emptyTenantSettings(),
    settingsId: resource?.id ?? '',
    tenantId: attributes?.name ?? '',
    domain: attributes?.domain ?? '',
    theme,
    logo: theme.main_logo ?? null,
    favicon: theme.favicon ?? null,
    env: toRecord(attributes?.env),
    features: toRecord<boolean>(attributes?.features),
    landingTitle: attributes?.landing_title ?? null,
    landingSlogan: attributes?.landing_slogan ?? null,
    privacyPolicy: attributes?.privacy_policy ?? null,
    readOnlyMode: parseSettingsFlag(theme.read_only_mode)
  }
}

type Resolver = (domain: string) => Promise<TenantSettings>

/** Strip port / normalize host → bare hostname used as the tenant domain. */
export function resolveActiveDomain(host: string): string {
  return ((host || '').split(':')[0] ?? '').trim().toLowerCase()
}

export function createSettingsGate(resolve: Resolver) {
  let pending: Promise<TenantSettings> | null = null
  let resolved: TenantSettings | null = null

  return {
    async ensure(host: string): Promise<TenantSettings> {
      if (resolved) return resolved
      if (pending) return pending
      const domain = resolveActiveDomain(host)
      pending = resolve(domain).then(s => (resolved = s))
      return pending
    },

    get current() { return resolved },

    applyTheme(tokens: Record<string, string>) {
      if (typeof document === 'undefined') return
      for (const [k, v] of Object.entries(tokens)) {
        document.documentElement.style.setProperty(`--${k}`, v)
      }
    }
  }
}
