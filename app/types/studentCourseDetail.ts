import { toCourseDetail } from './course'
import type { CourseDetail, RawCourseDetail } from './course'

export interface SessionRecording {
  id: string
  fileName: string
  /** Direct media URL — what the legacy `playMedia` feeds the player. */
  url: string
}

export interface CourseSessionItem {
  id: string
  content: string
  /** 'live_session' rows are the only ones that show a date/time line. */
  sessionType: string
  date: string
  startTime: string
  endTime: string
  isAppendix: boolean
  progress: number
  /** Parent-only attendance label, already localized by the backend. */
  attendance: string | null
  recordings: SessionRecording[]
  /** Backend-driven row actions, e.g. `start_session`. */
  actions: { key: string, label: string, endpointUrl: string }[]
}

export interface CourseAction {
  key: string
  label: string
  endpointUrl: string
}

export interface StudentCourseDetail extends CourseDetail {
  isSubscribed: boolean
  allowAccessAfterExpiry: boolean
  studentsCount: number
  /** Preview video URL; falls back to the poster image when empty. */
  previewMedia: string
  sessionItems: CourseSessionItem[]
  /** Course-level permissions, e.g. `course_rate`, `subscribe_course`. */
  actions: CourseAction[]
}

interface RawAction {
  key?: string
  label?: string
  endpoint_url?: string
}

function toActions(raw?: { data?: RawAction[] }): CourseAction[] {
  return (raw?.data ?? []).map(a => ({
    key: a.key ?? '',
    label: a.label ?? '',
    endpointUrl: a.endpoint_url ?? ''
  }))
}

/** Legacy `hasPermission(course, key)` — the backend gates by action key. */
export function hasCourseAction(
  course: Pick<StudentCourseDetail, 'actions'> | null | undefined,
  key: string
): boolean {
  return Boolean(course?.actions.some(a => a.key === key))
}

export interface RawCourseSession {
  id?: string | number
  content?: string
  session_type?: string
  date?: string
  start_time?: string
  end_time?: string
  is_apendix?: boolean
  is_appendix?: boolean
  session_progress?: number
  attendance?: string
  recordedSessions?: { data?: { id?: string | number, file_name?: string, url?: string }[] }
  actions?: { data?: RawAction[] }
}

export interface RawStudentCourseDetail extends RawCourseDetail {
  is_subscribe?: boolean
  allow_access_after_expiry?: boolean
  students_count?: number
  preview_media?: string
  sessions?: { data?: RawCourseSession[] }
  actions?: { data?: RawAction[] }
}

function toSession(raw: RawCourseSession): CourseSessionItem {
  return {
    id: String(raw.id ?? ''),
    content: raw.content ?? '',
    sessionType: raw.session_type ?? '',
    date: raw.date ?? '',
    startTime: raw.start_time ?? '',
    endTime: raw.end_time ?? '',
    isAppendix: Boolean(raw.is_apendix || raw.is_appendix),
    progress: raw.session_progress ?? 0,
    attendance: raw.attendance || null,
    recordings: (raw.recordedSessions?.data ?? []).map(r => ({
      id: String(r.id ?? ''),
      fileName: r.file_name ?? '',
      url: r.url ?? ''
    })),
    actions: toActions(raw.actions)
  }
}

export function toStudentCourseDetail(raw: RawStudentCourseDetail): StudentCourseDetail {
  return {
    ...toCourseDetail(raw),
    isSubscribed: Boolean(raw.is_subscribe),
    allowAccessAfterExpiry: Boolean(raw.allow_access_after_expiry),
    studentsCount: raw.students_count ?? 0,
    previewMedia: raw.preview_media ?? '',
    // The legacy list hides appendix rows; those belong to pathway views.
    sessionItems: (raw.sessions?.data ?? []).map(toSession).filter(s => !s.isAppendix),
    actions: toActions(raw.actions)
  }
}


export function canShowRecordings(session: CourseSessionItem): boolean {
  if (session.sessionType !== 'live_session') return true
  if (!session.date || !session.endTime) return false
  return new Date(`${session.date} ${session.endTime}`).getTime() < Date.now()
}

export type { MediaFile as SessionFile, RawMediaFile as RawSessionFile } from './media'
export { toMediaFile as toSessionFile } from './media'
