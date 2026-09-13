// app/types/studentCourse.ts
//
// The dashboard courses page reads `GET student/courses` (auth-only, so the
// row shape below is transcribed from the legacy readers rather than a live
// response — see the ⚠️ note in app/types/notification.ts for why that
// distinction matters).
//
// Rows are the same `course` resource the public listing returns, so they
// reuse `toCourse`; the `subscribed=1` tab adds the progress fields the
// legacy enrolled card reads (`shaham-go-fe/components/courses/
// enrolled-course.vue`).
import { toCourse } from './course'
import type { Course, RawCourse } from './course'

export interface EnrolledCourse extends Course {
  description: string
  attendedSessions: number
  totalSessions: number
  /** 0-100, drives the progress bar. */
  progress: number
}

export interface RawEnrolledCourse extends RawCourse {
  description?: string
  small_picture?: string
  number_of_attended_sessions?: number
  number_of_sessions?: number
  progress?: number
}

export function toEnrolledCourse(raw: RawEnrolledCourse): EnrolledCourse {
  return {
    ...toCourse(raw),
    // The enrolled card is image-led and uses the small variant.
    image: raw.small_picture || raw.medium_picture || raw.picture || '',
    description: raw.description ?? '',
    attendedSessions: raw.number_of_attended_sessions ?? 0,
    totalSessions: raw.number_of_sessions ?? 0,
    progress: raw.progress ?? 0
  }
}

// --- Filter lookups — `GET look-up?include=price,instructors,rate`
// (verified live: instructors carry `key: "instructor_id"`, while price/rate
// are sort keys carrying `value: "asc" | "desc"`).
export interface LookupOption {
  label: string
  value: string
}

export interface RawLookupOption {
  label?: string
  value?: string | number
}

export function toLookupOption(raw: RawLookupOption): LookupOption {
  return {
    label: (raw.label ?? '').trim(),
    value: String(raw.value ?? '')
  }
}

export interface CourseFilters {
  searchKey: string
  instructorIds: string[]
  price: string | null
  rate: string | null
  educationalSystemId: string | null
}

export function emptyCourseFilters(): CourseFilters {
  return {
    searchKey: '',
    instructorIds: [],
    price: null,
    rate: null,
    educationalSystemId: null
  }
}
