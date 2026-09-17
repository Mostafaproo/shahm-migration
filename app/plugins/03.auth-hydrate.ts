import type { AuthUser } from '~/core/auth'
import { useAuthStore } from '../stores/auth'

export default defineNuxtPlugin({
  name: 'auth-hydrate',
  setup() {
    const auth = useAuthStore()
    const tenant = useTenant()
    const session = useCookie<string | null>('shaham_session')
    const user = useCookie<AuthUser | null>('shaham_user')

    if (session.value) auth.token = session.value

    const profile = user.value
    const isUsable = typeof profile === 'object' && profile !== null
      && Boolean(profile.id) && Boolean(profile.user_type)

    if (session.value && isUsable) {
      auth.user = profile
      auth.ctx = {
        userId: profile.id,
        tenantId: tenant.tenantId,
        userType: profile.user_type,
        capabilities: []
      }
    }
  }
})
