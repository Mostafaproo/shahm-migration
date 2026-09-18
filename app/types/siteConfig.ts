export type SiteConfig = Record<string, string>

export interface RawConfigRow {
  field?: string
  value?: string
}

export function toSiteConfig(rows: RawConfigRow[]): SiteConfig {
  const config: SiteConfig = {}
  for (const row of rows) {
    if (row.field) config[row.field] = row.value ?? ''
  }
  return config
}
