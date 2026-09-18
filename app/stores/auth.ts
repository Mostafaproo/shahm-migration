// app/stores/auth.ts
import { defineStore } from 'pinia'
import { decodeJwt, resolveAuthHomePath, toAuthUser } from '~/core/auth'
import type { AuthContextData, AuthUser, UserType } from '~/core/auth'

export const useAuthStore = defineStore('auth', {
  state: (): {
    ctx: AuthContextData | null
    user: AuthUser | null
    /** In-memory bearer token — read first by the http plugin's getToken(). */
    token: string | null
  } => ({
    ctx: null,
    user: null,
    token: null
  }),
  getters: {
    isAuthenticated: s => s.ctx !== null,
    userType: s => s.ctx?.userType ?? null,
    fullName: s => s.user?.name ?? null
  },
  actions: {
    can(capability: string): boolean {
      return this.ctx?.capabilities.includes(capability) ?? false
    },

    clear() {
      this.ctx = null
      this.user = null
      this.token = null
      const session = useCookie('shaham_session')
      const user = useCookie('shaham_user')
      session.value = null
      user.value = null
      refreshCookie('shaham_session')
      refreshCookie('shaham_user')
    },

    /**
     * Persists the session (token + profile cookies) and hydrates store state.
     * `rememberMe: false` writes a session-only cookie (cleared when the
     * browser closes) instead of one that outlives the token's own `exp`.
     */
    applyAuthSession(token: string, profile: AuthUser, tenantId: string, rememberMe = true) {
      this.token = token

      // The token may be an opaque (non-JWT) bearer credential — fall back to
      // the cookie's default lifetime rather than failing the whole login.
      let maxAge: number | undefined
      if (rememberMe) {
        try {
          maxAge = decodeJwt(token).exp - Math.floor(Date.now() / 1000)
        } catch {
          maxAge = undefined
        }
      }
      const cookieOptions = { path: '/', sameSite: 'lax' as const, ...(maxAge ? { maxAge } : {}) }

      const session = useCookie<string | null>('shaham_session', cookieOptions)
      session.value = token
      const userCookie = useCookie<AuthUser | null>('shaham_user', cookieOptions)
      userCookie.value = profile
      refreshCookie('shaham_session')
      refreshCookie('shaham_user')

      this.user = profile
      this.ctx = { userId: profile.id, tenantId, userType: profile.user_type, capabilities: [] }
    },

    async login(payload: { identifier: string, password: string, userType: UserType, rememberMe?: boolean }): Promise<boolean> {
      const http = useHttp()
      const tenant = useTenant()
      const nuxtApp = useNuxtApp()
      const localePath = useLocalePath()
      const locale = (unref((nuxtApp.$i18n as { locale?: unknown } | undefined)?.locale) as string | undefined) ?? 'ar'

      const result = await http.post<{ meta?: { token?: string } }>(
        `/${locale}/auth/login`,
        { type: 'user', id: 'null', payload: { email: payload.identifier, password: payload.password } },
        { query: { device_type: `web_${payload.userType}`, abilities_user: true } }
      )
      const token = result?.meta?.token
      if (!token) return false

      // Set the in-memory token before the profile fetch below — the http
      // plugin's getToken() reads `this.token` fresh on every request.
      this.token = token

      const profileRes = await http.get<{ data?: Partial<AuthUser> }>(`/${locale}/profile`)
      const profile = toAuthUser(profileRes?.data ?? {})

      return nuxtApp.runWithContext(async () => {
        this.applyAuthSession(token, profile, tenant.tenantId, payload.rememberMe ?? true)
        await navigateTo(localePath(resolveAuthHomePath({ userType: this.userType })))
        return true
      })
    },

    async register(payload: {
      first_name: string
      mobile: string
      password: string
      password_confirmation: string
      userType: UserType
    }): Promise<boolean> {
      const http = useHttp()
      const nuxtApp = useNuxtApp()
      // See the comment in login() — useI18n() (Vue inject-based) throws
      // when called from here; read the locale off $i18n directly instead.
      const locale = (unref((nuxtApp.$i18n as { locale?: unknown } | undefined)?.locale) as string | undefined) ?? 'ar'
      const res = await http.post(
        `/${locale}/auth/register`,
        {
          type: 'user',
          id: 'null',
          payload: {
            first_name: payload.first_name,
            mobile: payload.mobile,
            password: payload.password,
            password_confirmation: payload.password_confirmation,
            user_type: payload.userType
          }
        },
        { query: { abilities_user: true } }
      )
      // Legacy `this.$toast(res, ...)` — the sign-up confirmation the server
      // sends, shown before the redirect to the OTP screen.
      const message = serverMessage(res)
      if (message) nuxtApp.$appToast.success(message)
      return true
    },
    async refreshUser(): Promise<void> {
      const http = useHttp()
      const nuxtApp = useNuxtApp()
      const locale = (unref((nuxtApp.$i18n as { locale?: unknown } | undefined)?.locale) as string | undefined) ?? 'ar'

      try {
        const res = await http.get<{ data?: Partial<AuthUser> }>(`/${locale}/profile`, { preventToast: true })
        if (!res?.data) return
        const profile = toAuthUser(res.data)
        this.user = profile

        await nuxtApp.runWithContext(() => {
          const userCookie = useCookie<AuthUser | null>('shaham_user', { path: '/', sameSite: 'lax' })
          userCookie.value = profile
          refreshCookie('shaham_user')
        })
      } catch {
        // A stale navbar is better than dropping the session over a refresh.
      }
    },

    // --- Password reset (3 steps, ported from the legacy `store/auth_`):

    /** Step 1 — also reused as the OTP screen's "resend" action. */
    async sendResetCode(identifier: string): Promise<string | null> {
      const http = useHttp()
      const nuxtApp = useNuxtApp()
      const locale = (unref((nuxtApp.$i18n as { locale?: unknown } | undefined)?.locale) as string | undefined) ?? 'ar'

      const res = await http.post<{ meta?: { message?: string } }>(
        `/${locale}/auth/reset-password/send/code`,
        { type: 'user', id: 'null', payload: { identifier } },
        { query: { abilities_user: true } }
      )
      return serverMessage(res)
    },

    /**
     * Step 2 — returns the reset token that step 3 needs.
     * The backend names the identifier field `mobile` even when it holds an
     * email; the legacy passes it through unchanged, so this does too.
     */
    async confirmResetOtp(payload: { otp: string, identifier: string }): Promise<{
      token: string | null
      message: string | null
    }> {
      const http = useHttp()
      const nuxtApp = useNuxtApp()
      const locale = (unref((nuxtApp.$i18n as { locale?: unknown } | undefined)?.locale) as string | undefined) ?? 'ar'

      const res = await http.post<{
        data?: unknown
        meta?: { message?: string, token?: string }
      }>(
        `/${locale}/auth/reset-password/confirm/code`,
        { type: 'user', id: 'null', payload: { otp: payload.otp, mobile: payload.identifier } },
        { query: { abilities_user: true } }
      )

      // Legacy reads the token from three different places because the shape
      // has moved around; keep the same tolerance.
      const doc = res?.data as { data?: unknown, token?: string } | undefined
      const rows = Array.isArray(doc) ? doc : doc?.data
      const first = (Array.isArray(rows) ? rows[0] : undefined) as { token?: string } | undefined

      return {
        token: first?.token ?? doc?.token ?? res?.meta?.token ?? null,
        message: serverMessage(res)
      }
    },

    /** Step 3 — the token comes from `confirmResetOtp`. */
    async resetPassword(payload: {
      token: string
      password: string
      password_confirmation: string
    }): Promise<string | null> {
      const http = useHttp()
      const nuxtApp = useNuxtApp()
      const locale = (unref((nuxtApp.$i18n as { locale?: unknown } | undefined)?.locale) as string | undefined) ?? 'ar'

      const res = await http.post<{ meta?: { message?: string } }>(
        `/${locale}/auth/reset-password/${payload.token}`,
        {
          type: 'user',
          id: 'null',
          payload: {
            password: payload.password,
            password_confirmation: payload.password_confirmation
          }
        },
        { query: { abilities_user: true } }
      )
      return serverMessage(res)
    },

    async logout() {
      this.clear()
      const localePath = useLocalePath()
      await navigateTo(localePath('/auth/login'), { replace: true })
    }
  }
})
