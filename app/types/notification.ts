// app/types/notification.ts
//
// ⚠️ UNVERIFIED CONTRACT — `GET notifications` is auth-only (403 without a
// bearer token) and there are no test credentials yet, so this shape is
// transcribed from the legacy reader in
// `shaham-go-fe/components/globals/navs/Header.vue`:
//   body.data.notificationsData.data  → the rows
//   body.meta[0].pagination           → { current_page, total_pages, … }
//   body.data.unread_count            → GET notifications/unread-count
// Note this endpoint is NOT JSON:API shaped, so the http client is called
// with `deserialize: false` and the raw body is read directly.
export interface AppNotification {
  id: string
  title: string
  body: string
  createdAt: string
  isRead: boolean
  /** Legacy opens this in a new tab when the row is clicked. */
  url: string | null
  meetingType: string | null
  vcrSessionId: string | null
  vcrSessionType: string | null
}

export interface RawNotification {
  id?: string | number
  title?: string
  body?: string
  created_at?: string
  /** Legacy treats any truthy value here as "read". */
  read_at?: string | boolean | null
  url?: string
  meeting_type?: string
  vcr_session_id?: string | number
  vcr_session_type?: string
}

export interface NotificationsPagination {
  current_page?: number
  total_pages?: number
}

/** Raw body of `GET notifications?page=N` — read with `deserialize: false`. */
export interface RawNotificationsBody {
  data?: { notificationsData?: { data?: RawNotification[] } }
  meta?: { pagination?: NotificationsPagination }[]
}

/** Raw body of `GET notifications/unread-count`. */
export interface RawUnreadCountBody {
  data?: { unread_count?: number }
}

export function toNotification(raw: RawNotification): AppNotification {
  return {
    id: String(raw.id ?? ''),
    title: raw.title ?? '',
    body: raw.body ?? '',
    createdAt: raw.created_at ?? '',
    isRead: Boolean(raw.read_at),
    url: raw.url || null,
    meetingType: raw.meeting_type || null,
    vcrSessionId: raw.vcr_session_id != null ? String(raw.vcr_session_id) : null,
    vcrSessionType: raw.vcr_session_type || null
  }
}
