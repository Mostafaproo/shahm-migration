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
    if (session.value && user.value) {
      auth.user = user.value
      auth.ctx = {
        userId: user.value.id,
        tenantId: tenant.tenantId,
        userType: user.value.user_type,
        capabilities: []
      }
    }
  }
})
