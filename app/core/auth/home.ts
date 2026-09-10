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
