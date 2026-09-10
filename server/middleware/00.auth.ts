/**
 * Nitro server middleware — best-effort expiry check on the shaham_session
 * cookie before any route handler or SSR render runs.
 *
 * The token may be an opaque (non-JWT) bearer credential (see
 * core/auth/jwt.ts) — a decode failure just means "can't tell, leave it",
 * NOT an invalid session; only a confirmed-expired JWT clears the cookies.
 *
 * @see app/plugins/03.auth-hydrate.ts
 */
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
