import type { UserType } from './home'

export interface DashboardNavItem {
  /** i18n key. */
  label: string
  icon: string
  to: string
  /** Hidden unless the tenant has this feature enabled. */
  feature?: string
}

/** Shown to every signed-in role, above the role-specific items. */
const SHARED: DashboardNavItem[] = [
  { label: 'dashboard.nav.notifications', icon: 'i-lucide-bell', to: '/notifications' }
]

const STUDENT: DashboardNavItem[] = [
  { label: 'dashboard.nav.courses', icon: 'i-lucide-book-open', to: '/student/courses' },
  { label: 'dashboard.nav.packages', icon: 'i-lucide-package', to: '/student/packages' },
  {
    label: 'dashboard.nav.pathways',
    icon: 'i-lucide-route',
    to: '/student/pathways',
    feature: 'learning_path'
  },
  { label: 'dashboard.nav.reports', icon: 'i-lucide-clipboard-list', to: '/student/homework-reports' },
  {
    label: 'dashboard.nav.computerized',
    icon: 'i-lucide-monitor-check',
    to: '/student/computerized-test',
    feature: 'computerized_exam'
  },
  {
    label: 'dashboard.nav.certificates',
    icon: 'i-lucide-award',
    to: '/student/certificates',
    feature: 'certificates'
  },
  {
    label: 'dashboard.nav.invitations',
    icon: 'i-lucide-users',
    to: '/student/invitations',
    feature: 'invitations'
  }
]

// Mirrors the legacy instructor sidebar. Entries are added as each module is
// migrated — an unmigrated one would only be a dead link.
const INSTRUCTOR: DashboardNavItem[] = [
  { label: 'dashboard.nav.courses', icon: 'i-lucide-book-open', to: '/instructor/courses' },
  {
    label: 'dashboard.nav.exam_reports',
    icon: 'i-lucide-clipboard-list',
    to: '/instructor/homework-reports'
  },
  { label: 'dashboard.nav.media_library', icon: 'i-lucide-folder-open', to: '/instructor/media-library' }
]

// Likewise for the parent domain, which has not been migrated yet.
const PARENT: DashboardNavItem[] = []

const BY_ROLE: Record<UserType, DashboardNavItem[]> = {
  student: STUDENT,
  instructor: INSTRUCTOR,
  parent: PARENT
}

/**
 * The sidebar for a role, already filtered by the tenant's features.
 * An unknown/absent role gets the shared items only — never another role's.
 */
export function dashboardNav(
  userType: UserType | null | undefined,
  features: Record<string, boolean>
): DashboardNavItem[] {
  const items = [...SHARED, ...(userType ? BY_ROLE[userType] ?? [] : [])]
  return items.filter(item => !item.feature || features[item.feature])
}
