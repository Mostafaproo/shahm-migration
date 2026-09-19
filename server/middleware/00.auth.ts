import { decodeJwt, JwtError } from '~/core/auth'
import type { JwtPayload } from '~/core/auth'

export interface ServerAuthContext {
  token: string
  claims: JwtPayload | null
}

declare module 'h3' {
  interface H3EventContext {
    auth: ServerAuthContext | null
  }
}

export default defineEventHandler((event) => {
  const token = getCookie(event, 'shaham_session')
  if (!token) {
    event.context.auth = null
    return
  }

  try {
    event.context.auth = { token, claims: decodeJwt(token) }
  } catch (err) {
    if (err instanceof JwtError && err.code === 'EXPIRED') {
      deleteCookie(event, 'shaham_session')
      deleteCookie(event, 'shaham_user')
      event.context.auth = null
      return
    }
    event.context.auth = { token, claims: null }
  }
})
