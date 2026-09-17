import { decodeJwt, JwtError } from '~/core/auth'

export default defineEventHandler((event) => {
  const token = getCookie(event, 'shaham_session')
  if (!token) return

  try {
    decodeJwt(token)
  } catch (err) {
    if (err instanceof JwtError && err.code === 'EXPIRED') {
      deleteCookie(event, 'shaham_session')
      deleteCookie(event, 'shaham_user')
    }
  }
})
