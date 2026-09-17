import { toCourse } from './course'
import type { Course, RawCourse } from './course'

export interface CoursePackage {
  id: string
  name: string
  image: string
  price: string
  description: string
  viewsCount: number
  subscriptionsCount: number
  /** The backend sends -1 for "unlimited" — normalized to null here. */
  availableSeats: number | null
}

export interface RawCoursePackage {
  id?: string | number
  name?: string
  image?: string
  price?: string | number
  description?: string
  views_count?: number
  number_of_subscriptions?: number
  /** Backend spelling — typo is theirs, kept only at the wire boundary. */
  available_seets?: number | string
}

export interface CoursePackageDetail extends CoursePackage {
  courses: Course[]
}

export interface RawCoursePackageDetail extends RawCoursePackage {
  courses?: { data?: RawCourse[] }
}

export function toCoursePackage(raw: RawCoursePackage): CoursePackage {
  const seats = raw.available_seets != null ? Number(raw.available_seets) : null

  return {
    id: String(raw.id ?? ''),
    name: raw.name ?? '',
    image: raw.image ?? '',
    price: String(raw.price ?? ''),
    description: raw.description ?? '',
    viewsCount: raw.views_count ?? 0,
    subscriptionsCount: raw.number_of_subscriptions ?? 0,
    availableSeats: seats != null && seats >= 0 ? seats : null
  }
}

export function toCoursePackageDetail(raw: RawCoursePackageDetail): CoursePackageDetail {
  return {
    ...toCoursePackage(raw),
    courses: (raw.courses?.data ?? []).map(toCourse)
  }
}

// --- Signed-in package view — `GET student/packages` / `student/packages/{id}`.
//
// ⚠️ UNVERIFIED CONTRACT — auth-only endpoints, so these extra fields come from
// the legacy `pages/course-packages/_id.vue` and `components/PackageCard.vue`.
export interface PackageAction {
  key: string
  label: string
  endpointUrl: string
}

export interface StudentCoursePackage extends CoursePackage {
  isSubscribed: boolean
  /** Backend-driven permissions, e.g. `view_package`, `subscribe_package`. */
  actions: PackageAction[]
}

export interface StudentCoursePackageDetail extends StudentCoursePackage {
  courses: Course[]
}

interface RawPackageAction {
  key?: string
  label?: string
  endpoint_url?: string
}

export interface RawStudentCoursePackage extends RawCoursePackage {
  is_subscribe?: boolean
  actions?: { data?: RawPackageAction[] }
}

export interface RawStudentCoursePackageDetail extends RawStudentCoursePackage {
  courses?: { data?: RawCourse[] }
}

function toPackageActions(raw?: { data?: RawPackageAction[] }): PackageAction[] {
  return (raw?.data ?? []).map(a => ({
    key: a.key ?? '',
    label: a.label ?? '',
    endpointUrl: a.endpoint_url ?? ''
  }))
}

export function toStudentCoursePackage(raw: RawStudentCoursePackage): StudentCoursePackage {
  return {
    ...toCoursePackage(raw),
    isSubscribed: Boolean(raw.is_subscribe),
    actions: toPackageActions(raw.actions)
  }
}

export function toStudentCoursePackageDetail(
  raw: RawStudentCoursePackageDetail
): StudentCoursePackageDetail {
  return {
    ...toStudentCoursePackage(raw),
    courses: (raw.courses?.data ?? []).map(toCourse)
  }
}
