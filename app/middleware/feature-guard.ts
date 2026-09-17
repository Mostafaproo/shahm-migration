export default defineNuxtRouteMiddleware((to) => {
  const feature = to.meta.feature
  if (typeof feature !== 'string') return

  const tenant = useTenant()
  if (tenant.features[feature]) return

  throw createError({
    statusCode: 404,
    statusMessage: `Feature "${feature}" is not enabled for this tenant`,
    fatal: true
  })
})
