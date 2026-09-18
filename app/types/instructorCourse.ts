export interface InstructorCourse {
  id: string
  name: string
  image: string
  sessionsCount: number
  viewsCount: number
  startDate: string
  rating: number
}

export interface RawInstructorCourse {
  id?: string | number
  name?: string
  picture?: string
  number_of_sessions?: number | string
  views_count?: number | string
  start_date?: string
  ratings?: { data?: { total?: { stars?: number } } } | number | string
}

function readRating(raw: RawInstructorCourse['ratings']): number {
  if (raw == null) return 0
  if (typeof raw === 'object') return Number(raw.data?.total?.stars ?? 0) || 0
  return Number(raw) || 0
}

export function toInstructorCourse(raw: RawInstructorCourse): InstructorCourse {
  return {
    id: String(raw.id ?? ''),
    name: raw.name ?? '',
    image: raw.picture ?? '',
    sessionsCount: Number(raw.number_of_sessions ?? 0) || 0,
    viewsCount: Number(raw.views_count ?? 0) || 0,
    startDate: raw.start_date ?? '',
    rating: readRating(raw.ratings)
  }
}

// --- Sessions

export interface SessionAction {
  key: string
  label: string
  endpointUrl: string
}

export interface InstructorSession {
  id: string
  content: string
  /** Only `live_session` rows show the date/time line. */
  sessionType: string
  date: string
  startTime: string
  endTime: string
  /** Needed by the media uploader; the legacy passes it straight through. */
  vcrSessionId: string | null
  recordings: { id: string, fileName: string, url: string }[]
  actions: SessionAction[]
  /** True when the whole course has ended — blocks uploads in the legacy. */
  courseEnded: boolean
}

interface RawAction {
  key?: string
  label?: string
  endpoint_url?: string
}

export interface RawInstructorSession {
  id?: string | number
  content?: string
  session_type?: string
  date?: string
  start_time?: string
  end_time?: string
  vcr_session_id?: string | number
  recordedSessions?: { data?: { id?: string | number, file_name?: string, url?: string }[] }
  actions?: { data?: RawAction[] }
  course?: { data?: { is_ended?: boolean } }
}

export function toInstructorSession(raw: RawInstructorSession): InstructorSession {
  return {
    id: String(raw.id ?? ''),
    content: raw.content ?? '',
    sessionType: raw.session_type ?? '',
    date: raw.date ?? '',
    startTime: raw.start_time ?? '',
    endTime: raw.end_time ?? '',
    vcrSessionId: raw.vcr_session_id != null ? String(raw.vcr_session_id) : null,
    recordings: (raw.recordedSessions?.data ?? []).map(r => ({
      id: String(r.id ?? ''),
      fileName: r.file_name ?? '',
      url: r.url ?? ''
    })),
    actions: (raw.actions?.data ?? []).map(a => ({
      key: a.key ?? '',
      label: a.label ?? '',
      endpointUrl: a.endpoint_url ?? ''
    })),
    courseEnded: Boolean(raw.course?.data?.is_ended)
  }
}

export function startSessionAction(session: InstructorSession): SessionAction | undefined {
  return session.actions.find(a => a.key === 'start_session')
}

// --- Discussion-room roster (the "deactivate a student" modal)

export interface DiscussionStudent {
  id: string
  name: string
  avatar: string | null
  /** The backend hands back a toggle URL per student rather than a boolean. */
  toggleUrl: string
  isActive: boolean
}

export interface RawDiscussionStudent {
  id?: string | number
  name?: string
  profile_picture?: string
  /** The roster endpoint returns this one already camelCased. */
  isActive?: boolean
  is_active?: boolean
  actions?: { data?: RawAction[] }
}

export function toDiscussionStudent(raw: RawDiscussionStudent): DiscussionStudent {
  const toggle = (raw.actions?.data ?? []).find(a => a.key === 'activate_student_course')
  const flag = raw.isActive ?? raw.is_active
  return {
    id: String(raw.id ?? ''),
    name: raw.name ?? '',
    avatar: raw.profile_picture ?? null,
    toggleUrl: toggle?.endpoint_url ?? '',
    // The row carries the state directly, which is what the legacy binds its
    // switch to. The action label is only a fallback for rows that omit it.
    isActive: flag ?? (toggle ? toggle.label === 'Inactivate' || toggle.label === 'تعطيل' : false)
  }
}
