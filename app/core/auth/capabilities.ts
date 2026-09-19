import type { UserType } from './home'

export interface AuthContextData {
  userId: string
  tenantId: string
  userType: UserType | null
  capabilities: string[]
}

export function can(ctx: AuthContextData | null, capability: string): boolean {
  return ctx?.capabilities.includes(capability) ?? false
}
