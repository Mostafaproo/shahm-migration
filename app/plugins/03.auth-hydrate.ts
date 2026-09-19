import type { AuthUser, UserType } from '~/core/auth'
import { useAuthStore } from '../stores/auth'

/** Shapes the profile cookie must satisfy before we trust it. */
function usableProfile(value: unknown): value is AuthUser {
  if (typeof value !== 'object' || value === null) return false
  const profile = value as Partial<AuthUser>
  return Boolean(profile.id) && Boolean(profile.user_type)
}

export default defineNuxtPlugin({
  name: 'auth-hydrate',
  setup(nuxtApp) {
    const auth = useAuthStore()
    const session = useCookie<string | null>('shaham_session')
    const user = useCookie<AuthUser | null>('shaham_user')

    const event = import.meta.server ? useRequestEvent() : null
    const token = event ? (event.context.auth?.token ?? null) : session.value
    if (!token) return

    auth.token = token

    const profile = user.value
    if (usableProfile(profile)) auth.user = profile

    let tenantId: string
    try {
      tenantId = (nuxtApp.$tenant as { tenantId?: string } | undefined)?.tenantId ?? ''
    } catch {
      tenantId = ''
    }

    const claimedType = event?.context.auth?.claims?.user_type
    const userType = (profile?.user_type
      ?? (typeof claimedType === 'string' ? claimedType : undefined)) as UserType | undefined

    auth.ctx = {
      userId: profile?.id ?? '',
      tenantId,
      userType: userType ?? null,
      capabilities: []
    }

    if (import.meta.client && !profile) {
      void auth.refreshUser()
    }
  }
})
