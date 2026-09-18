import type { UserType } from '~/core/auth'

export default defineNuxtRouteMiddleware((to) => {
  const roles = to.meta.roles
  if (!Array.isArray(roles) || !roles.length) return

  const auth = useAuthStore()
  if (!auth.userType) return
  if (roles.includes(auth.userType as UserType)) return

  throw createError({
    statusCode: 404,
    statusMessage: `This page is not available for ${auth.userType} accounts`,
    fatal: true
  })
})
