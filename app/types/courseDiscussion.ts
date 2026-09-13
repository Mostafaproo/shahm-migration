export interface DiscussionAuthor {
  name: string
  avatar: string | null
}

export interface DiscussionAction {
  key: string
  label: string
  endpointUrl: string
}

export interface DiscussionReply {
  id: string
  comment: string
  createdAt: string
  author: DiscussionAuthor
  actions: DiscussionAction[]
}

export interface Discussion {
  id: string
  body: string
  publishedAt: string
  author: DiscussionAuthor
  replies: DiscussionReply[]
  /** Replies paginate independently of the discussion list. */
  repliesPage: number
  repliesTotalPages: number
  actions: DiscussionAction[]
}

export interface DiscussionRoomState {
  /** The backend can mute a student inside a single course's room. */
  isUserActive: boolean
  /** True once the course has ended — the room goes read-only. */
  isEnded: boolean
  discussions: Discussion[]
  page: number
  totalPages: number
}

// --- Raw (post-deserialization) shapes
interface RawUser {
  data?: { name?: string, profile_picture?: string }
}

interface RawAction {
  key?: string
  label?: string
  endpoint_url?: string
}

interface RawPagination {
  current_page?: number
  total_pages?: number
}

export interface RawDiscussionReply {
  id?: string | number
  comment?: string
  createdAt?: string
  created_at?: string
  user?: RawUser
  actions?: { data?: RawAction[] }
}

export interface RawDiscussion {
  id?: string | number
  body?: string
  published_at?: string
  user?: RawUser
  comments?: { data?: RawDiscussionReply[] }
  pagination?: RawPagination
  actions?: { data?: RawAction[] }
}

export interface RawDiscussionRoom {
  is_user_active?: boolean
  is_ended?: boolean
  discussions?: { data?: RawDiscussion[] }
  pagination?: RawPagination
}

export interface RawRepliesPage {
  comments?: { data?: RawDiscussionReply[] }
  pagination?: RawPagination
}

function toAuthor(raw?: RawUser): DiscussionAuthor {
  return {
    name: raw?.data?.name ?? '',
    avatar: raw?.data?.profile_picture ?? null
  }
}

function toActions(raw?: { data?: RawAction[] }): DiscussionAction[] {
  return (raw?.data ?? []).map(a => ({
    key: a.key ?? '',
    label: a.label ?? '',
    endpointUrl: a.endpoint_url ?? ''
  }))
}

export function toDiscussionReply(raw: RawDiscussionReply): DiscussionReply {
  return {
    id: String(raw.id ?? ''),
    comment: raw.comment ?? '',
    // The list endpoint camelCases this one field; the create response doesn't.
    createdAt: raw.createdAt ?? raw.created_at ?? '',
    author: toAuthor(raw.user),
    actions: toActions(raw.actions)
  }
}

export function toDiscussion(raw: RawDiscussion): Discussion {
  return {
    id: String(raw.id ?? ''),
    body: raw.body ?? '',
    publishedAt: raw.published_at ?? '',
    author: toAuthor(raw.user),
    replies: (raw.comments?.data ?? []).map(toDiscussionReply),
    repliesPage: raw.pagination?.current_page ?? 1,
    repliesTotalPages: raw.pagination?.total_pages ?? 1,
    actions: toActions(raw.actions)
  }
}

// --- Action keys, straight from the legacy `v-if`s. The backend uses a
// different key per role for the same operation, hence the pairs.
const DELETE_DISCUSSION = ['instructor_delete_discussion', 'delete_course_discussion']
const DELETE_REPLY = ['instructor_delete_discussion_comment', 'delete_course_discussion_comment']

export function findAction(
  actions: DiscussionAction[],
  keys: string | string[]
): DiscussionAction | undefined {
  const wanted = Array.isArray(keys) ? keys : [keys]
  return actions.find(a => wanted.includes(a.key))
}

export const discussionActions = {
  delete: (d: Discussion) => findAction(d.actions, DELETE_DISCUSSION),
  update: (d: Discussion) => findAction(d.actions, 'update_course_discussion'),
  toggleActive: (d: Discussion) => findAction(d.actions, 'activate_student_course')
}

export const replyActions = {
  delete: (r: DiscussionReply) => findAction(r.actions, DELETE_REPLY),
  update: (r: DiscussionReply) => findAction(r.actions, 'update_course_discussion_comment')
}

/**
 * Legacy `checkActiveStudent`: the toggle has no boolean, only a label that
 * reads "deactivate" when the student is currently active.
 */
export function isStudentActive(label: string): boolean {
  return label === 'Inactivate' || label === 'تعطيل'
}
