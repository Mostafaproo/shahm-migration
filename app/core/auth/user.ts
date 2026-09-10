export interface AuthUser {
  id: string
  name: string
  /** Saudi mobile format (05XXXXXXXX) — the primary login identifier alongside email. */
  mobile: string | null
  email: string | null
  profile_picture: string | null
  is_active: boolean
  user_type: 'student' | 'instructor' | 'parent'
}

/**
 * Picks only the AuthUser fields from a raw profile response — drops
 * anything else (tokens, relationships) so the persisted cookie stays small.
 */
export function toAuthUser(data: Partial<AuthUser>): AuthUser {
  return {
    id: data.id ?? '',
    name: data.name ?? '',
    mobile: data.mobile ?? null,
    email: data.email ?? null,
    profile_picture: data.profile_picture ?? null,
    is_active: data.is_active ?? true,
    user_type: data.user_type ?? 'student'
  }
}
