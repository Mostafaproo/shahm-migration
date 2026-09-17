export interface Pathway {
  id: string
  name: string
  image: string
  cost: string
  progress: number
  nextCourseText: string
}

export interface RawPathway {
  id?: string | number
  name?: string
  image?: string
  cost?: string | number
  progress?: number | string
  next_course_text?: string
}

export function toPathway(raw: RawPathway): Pathway {
  return {
    id: String(raw.id ?? ''),
    name: raw.name ?? '',
    image: raw.image ?? '',
    cost: raw.cost != null ? String(raw.cost) : '',
    progress: Number(raw.progress ?? 0) || 0,
    nextCourseText: raw.next_course_text ?? ''
  }
}

// --- Detail

export type PathwayCourseStatus = 'completed' | 'in-progress' | 'not-started'

export interface PathwayCourse {
  id: string
  name: string
  image: string
  instructorId: string | null
  instructorName: string
  instructorAvatar: string | null
  progress: number
  status: PathwayCourseStatus
  /** Backend decides whether the student may open this step yet. */
  canAccess: boolean
}

export interface PathwayInstructor {
  id: string
  name: string
  avatar: string | null
  courseName: string
}

export interface PathwayDetail {
  id: string
  name: string
  image: string
  introVideo: string
  cost: string
  badge: string | null
  isSubscribed: boolean
  progress: number
  /** Where the student left off, shown as "continue from …". */
  lastCourseId: string | null
  lastCourseName: string
  description: string
  objective: string
  whatYouWillLearn: string
  /** Localized label; the backend sends a separate raw `path_type`. */
  typeLabel: string
  pathType: string
  durationMonths: number | null
  allowAccessAfterExpiry: boolean
  totalViews: number
  totalSubscribers: number
  courses: PathwayCourse[]
  certificateDescription: string
  finalProject: {
    hint: string
    isAccessible: boolean
    totalScore: number | null
  } | null
}

interface RawPathwayCourse {
  id?: string | number
  name?: string
  picture?: string
  course_progress?: number | string
  can_open?: boolean
  pivot?: { order?: number }
  instructor?: { data?: { id?: string | number, name?: string, profile_picture?: string } }
}

export interface RawPathwayDetail extends RawPathway {
  intro_video?: string
  badge?: string
  is_subscribed?: boolean
  last_session?: { course_id?: string | number, course_name?: string }
  description?: string
  objective?: string
  what_you_will_learn?: string
  type_label?: string
  path_type?: string
  duration_months?: number | string
  allow_access_after_expiry?: boolean
  total_views?: number
  total_subscribers?: number
  courses?: { data?: RawPathwayCourse[] }
  certificate_info?: { description?: string }
  final_project?: { hint?: string, is_accessible?: boolean, total_score?: number | string }
}

/** Legacy derives the step's state from its progress alone. */
export function courseStatus(progress: number): PathwayCourseStatus {
  if (progress === 100) return 'completed'
  return progress > 0 ? 'in-progress' : 'not-started'
}

export function toPathwayDetail(raw: RawPathwayDetail): PathwayDetail {
  // Legacy sorts the steps by `pivot.order` before rendering — the API does
  // not guarantee the order it returns them in.
  const courses = [...(raw.courses?.data ?? [])]
    .sort((a, b) => (a.pivot?.order ?? 0) - (b.pivot?.order ?? 0))
    .map((course): PathwayCourse => {
      const progress = Number(course.course_progress ?? 0) || 0
      const instructor = course.instructor?.data
      return {
        id: String(course.id ?? ''),
        name: course.name ?? '',
        image: course.picture ?? '',
        instructorId: instructor?.id != null ? String(instructor.id) : null,
        instructorName: instructor?.name ?? '',
        instructorAvatar: instructor?.profile_picture ?? null,
        progress,
        status: courseStatus(progress),
        canAccess: Boolean(course.can_open)
      }
    })

  const duration = raw.duration_months != null ? Number(raw.duration_months) : null

  return {
    id: String(raw.id ?? ''),
    name: raw.name ?? '',
    image: raw.image ?? '',
    introVideo: raw.intro_video ?? '',
    cost: raw.cost != null ? String(raw.cost) : '',
    badge: raw.badge || null,
    isSubscribed: Boolean(raw.is_subscribed),
    progress: Number(raw.progress ?? 0) || 0,
    lastCourseId: raw.last_session?.course_id != null ? String(raw.last_session.course_id) : null,
    lastCourseName: raw.last_session?.course_name ?? '',
    description: raw.description ?? '',
    objective: raw.objective ?? '',
    whatYouWillLearn: raw.what_you_will_learn ?? '',
    typeLabel: raw.type_label ?? '',
    pathType: raw.path_type ?? '',
    durationMonths: Number.isFinite(duration) ? duration : null,
    allowAccessAfterExpiry: Boolean(raw.allow_access_after_expiry),
    totalViews: raw.total_views ?? 0,
    totalSubscribers: raw.total_subscribers ?? 0,
    courses,
    certificateDescription: raw.certificate_info?.description ?? '',
    finalProject: raw.final_project
      ? {
          hint: raw.final_project.hint ?? '',
          isAccessible: Boolean(raw.final_project.is_accessible),
          totalScore: raw.final_project.total_score != null ? Number(raw.final_project.total_score) : null
        }
      : null
  }
}

/** Legacy builds the instructor strip from the steps, skipping ones with none. */
export function pathwayInstructors(detail: PathwayDetail): PathwayInstructor[] {
  return detail.courses
    .filter(course => course.instructorId)
    .map(course => ({
      id: course.instructorId!,
      name: course.instructorName,
      avatar: course.instructorAvatar,
      courseName: course.name
    }))
}
