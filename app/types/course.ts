// app/types/course.ts
//
// Public course listing resource — confirmed live against
// `GET {tenantBase}/landing-page/courses` (used by both the landing page's
// featured-courses section and the public `/courses` listing) via a captured
// network response and `shaham-go-fe/components/NewHome/CourseCard.vue`.
// After JSON:API deserialization (sarala-json-api-data-formatter keeps
// relationships wrapped as `{ data: … }`), a raw course looks like:
//   { id, name, medium_picture, subscription_cost, views_count,
//     remaining_places, instructors: { data: [{ id, name, profile_picture }] },
//     ratings: { data: { total: { stars, totalStars, total_students_ratings } } } }
// No duration/lessons-count/"completed" fields exist on this resource —
// don't invent them.
export interface CourseInstructor {
  id: string
  name: string
  profilePicture: string | null
}

export interface Course {
  id: string
  name: string
  image: string
  /** Pre-formatted by the backend, e.g. "50 ريال" — null when absent/free. */
  price: string | null
  viewsCount: number
  remainingPlaces: number | null
  ratingStars: number
  ratingTotalStars: number
  instructors: CourseInstructor[]
}

/** Raw shape of a `landing-page/courses` row after JSON:API deserialization. */
export interface RawCourse {
  id?: string | number
  name?: string
  medium_picture?: string
  picture?: string
  subscription_cost?: string
  views_count?: number
  remaining_places?: string | number
  instructors?: { data?: { id?: string | number, name?: string, profile_picture?: string }[] }
  ratings?: { data?: { total?: { stars?: number, totalStars?: number } } }
}

export function toCourse(raw: RawCourse): Course {
  const instructors = raw.instructors?.data ?? []
  const ratingTotal = raw.ratings?.data?.total ?? {}

  return {
    id: String(raw.id ?? ''),
    name: raw.name ?? '',
    image: raw.medium_picture || raw.picture || '',
    price: raw.subscription_cost || null,
    viewsCount: raw.views_count ?? 0,
    remainingPlaces: raw.remaining_places != null ? Number(raw.remaining_places) : null,
    ratingStars: ratingTotal.stars ?? 0,
    ratingTotalStars: ratingTotal.totalStars ?? 5,
    instructors: instructors.map(i => ({
      id: String(i?.id ?? ''),
      name: i?.name ?? '',
      profilePicture: i?.profile_picture ?? null
    }))
  }
}

// --- Single course detail page — confirmed live against
// `GET {tenantBase}/landing-page/courses/{id}` (embeds sessions AND rating
// details as relationships, so no separate `/sessions` or `/ratings` round
// trips are needed — the legacy `_id.vue` fetches those separately, but this
// backend already returns everything in one document).
export interface CourseSession {
  id: string
  date: string
  startTime: string
  endTime: string
  content: string
}

export interface CourseReview {
  id: string
  name: string
  image: string | null
  stars: number
  totalStars: number
  details: string
  date: string
}

export interface CourseRatingBar {
  stars: number
  totalStars: number
  percent: number
  totalStudentsRatings: number
}

export interface CourseDetail extends Course {
  description: string
  whatWeWillLearn: string
  totalRatings: number
  totalStudentsRatings: number
  ratingBreakdown: CourseRatingBar[]
  reviews: CourseReview[]
  sessions: CourseSession[]
  schoolName: string | null
}

export interface RawCourseDetail extends RawCourse {
  description?: string
  what_we_will_learn?: string
  schools?: { data?: { name?: string }[] }
  ratings?: {
    data?: {
      total?: { stars?: number, totalStars?: number, total?: number, total_students_ratings?: number }
      ratings?: { stars?: number, totalStars?: number, percent?: string | number, total_students_ratings?: number }[]
    }
  }
  ratingDetails?: { data?: { id?: string | number, name?: string, image?: string, stars?: number, totalStars?: number, details?: string, date?: string }[] }
  sessions?: { data?: { id?: string | number, date?: string, start_time?: string, end_time?: string, content?: string }[] }
}

export function toCourseDetail(raw: RawCourseDetail): CourseDetail {
  const base = toCourse(raw)
  const ratingData = raw.ratings?.data
  const school = raw.schools?.data?.[0]

  return {
    ...base,
    description: raw.description ?? '',
    whatWeWillLearn: raw.what_we_will_learn ?? '',
    totalRatings: ratingData?.total?.total ?? 0,
    totalStudentsRatings: ratingData?.total?.total_students_ratings ?? 0,
    ratingBreakdown: (ratingData?.ratings ?? []).map(r => ({
      stars: r.stars ?? 0,
      totalStars: r.totalStars ?? 5,
      percent: Number(r.percent ?? 0),
      totalStudentsRatings: r.total_students_ratings ?? 0
    })),
    reviews: (raw.ratingDetails?.data ?? []).map(r => ({
      id: String(r.id ?? ''),
      name: r.name ?? '',
      image: r.image ?? null,
      stars: r.stars ?? 0,
      totalStars: r.totalStars ?? 5,
      details: r.details ?? '',
      date: r.date ?? ''
    })),
    sessions: (raw.sessions?.data ?? []).map(s => ({
      id: String(s.id ?? ''),
      date: s.date ?? '',
      startTime: s.start_time ?? '',
      endTime: s.end_time ?? '',
      content: s.content ?? ''
    })),
    schoolName: school?.name ?? null
  }
}
