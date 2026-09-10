import type { TenantSettings } from '~/core/http'

export function useTenant(): TenantSettings {
  const { $tenant } = useNuxtApp()
  if (!$tenant) throw new Error('[useTenant] called before the settings-bootstrap plugin ran')
  return $tenant as TenantSettings
}
