import type { UserType } from './home'

export interface DashboardNavLink {
  /** i18n key. */
  label: string
  icon: string
  to: string
  /** Hidden unless the tenant has this feature enabled. */
  feature?: string
}

export interface DashboardNavGroup {
  label: string
  icon: string
  children: DashboardNavLink[]
  feature?: string
}

export type DashboardNavItem = DashboardNavLink | DashboardNavGroup

export function isNavGroup(item: DashboardNavItem): item is DashboardNavGroup {
  return 'children' in item
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

const INSTRUCTOR: DashboardNavItem[] = [
  { label: 'dashboard.nav.courses', icon: 'i-lucide-book-open', to: '/instructor/courses' },
  // The legacy groups each kind's list with its own reports.
  {
    label: 'dashboard.nav.exams',
    icon: 'i-lucide-file-question',
    children: [
      { label: 'dashboard.nav.exams', icon: 'i-lucide-file-question', to: '/instructor/exams' },
      {
        label: 'dashboard.nav.exam_reports',
        icon: 'i-lucide-history',
        to: '/instructor/exam-reports'
      }
    ]
  },
  {
    label: 'dashboard.nav.assignments',
    icon: 'i-lucide-notebook-pen',
    children: [
      {
        label: 'dashboard.nav.assignments',
        icon: 'i-lucide-notebook-pen',
        to: '/instructor/assignments'
      },
      {
        label: 'dashboard.nav.assignment_reports',
        icon: 'i-lucide-clipboard-check',
        to: '/instructor/assignment-reports'
      }
    ]
  },
  {
    label: 'dashboard.nav.computerized',
    icon: 'i-lucide-monitor-check',
    to: '/instructor/computerized-test',
    feature: 'computerized_exam'
  },
  {
    label: 'dashboard.nav.projects',
    icon: 'i-lucide-folder-kanban',
    to: '/instructor/projects',
    feature: 'learning_path'
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

export function dashboardNav(
  userType: UserType | null | undefined,
  features: Record<string, boolean>
): DashboardNavItem[] {
  const enabled = (item: { feature?: string }) => !item.feature || features[item.feature]

  return [...SHARED, ...(userType ? BY_ROLE[userType] ?? [] : [])]
    .filter(enabled)
    .map(item => (isNavGroup(item)
      ? { ...item, children: item.children.filter(enabled) }
      : item))
    // A group whose every child is feature-gated off is an empty heading.
    .filter(item => !isNavGroup(item) || item.children.length > 0)
}
