import { useAuthStore } from '../stores/auth'

const PUBLIC_PREFIXES = [
  '/auth',
  '/courses',
  '/instructors',
  '/packages',
  '/contact-us',
  '/about-us',
  '/privacy-policy'
]

export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore()

  // i18n strategy 'prefix' puts the locale first (/en/auth/login) — strip it
  // so route matching is locale-agnostic.
  const { $i18n, $localePath } = useNuxtApp()
  const localeCodes: string[] = unref($i18n?.localeCodes) ?? []
  const [first = '', ...rest] = to.path.split('/').filter(Boolean)
  const path = localeCodes.includes(first) ? `/${rest.join('/')}` : to.path

  if (!auth.isAuthenticated) {
    const isPublic = path === '/' || PUBLIC_PREFIXES.some(p => path === p || path.startsWith(`${p}/`))
    if (isPublic) return
    return navigateTo($localePath ? $localePath('/auth/login') : '/auth/login')
  }
})
