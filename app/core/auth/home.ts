import type { AuthUser } from './user'

export type UserType = AuthUser['user_type']

const HOME_PATHS: Record<UserType, string> = {
  student: '/student',
  instructor: '/instructor',
  parent: '/parent'
}

export function resolveAuthHomePath(opts?: { userType?: UserType | null }): string {
  const userType = opts?.userType
  return (userType && HOME_PATHS[userType]) || '/auth/login'
}

/**
 * Picks the route for the signed-in role out of a per-role map — the shape
 * every "same feature, different dashboard per role" entry point needs
 * (e.g. the computerized test: students and instructors each have their own
 * page). Returns null for guests, or for a role the caller has no page for,
 * so the caller decides where to send them instead.
 */
export function resolveRolePath(
  userType: UserType | null | undefined,
  paths: Partial<Record<UserType, string>>
): string | null {
  return (userType && paths[userType]) || null
}
