export interface JwtPayload {
  exp: number
  iat?: number
  sub?: string
  [claim: string]: unknown
}

export class JwtError extends Error {
  constructor(message: string, public code: 'INVALID' | 'EXPIRED' | 'MALFORMED') {
    super(message)
  }
}

export function decodeJwt(token: string): JwtPayload {
  const parts = token.split('.')
  if (parts.length !== 3) throw new JwtError('Three segments required', 'MALFORMED')

  let payload: JwtPayload
  try {
    const json = atob(parts[1]!.replace(/-/g, '+').replace(/_/g, '/'))
    payload = JSON.parse(json) as JwtPayload
  } catch { throw new JwtError('Payload parse failed', 'MALFORMED') }

  if (typeof payload.exp === 'number' && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new JwtError('Token expired', 'EXPIRED')
  }
  return payload
}
