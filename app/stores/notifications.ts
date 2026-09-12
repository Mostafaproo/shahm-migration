// app/stores/notifications.ts
//
// Ported 1:1 from the legacy notifications logic in
// `shaham-go-fe/components/globals/navs/Header.vue`:
//   GET notifications?page=N        — list, "load more" APPENDS
//   GET notifications/unread-count  — badge count
//   GET notifications/mark-read/:id — only for unread rows, then the local
//                                     row flips to read and the count drops
// State lives in a store (not per-page) because the topbar badge and the
// notifications page have to stay in sync, exactly like the legacy header.
//
// Fetching is client-only on purpose: this is per-user data behind auth, so
// there's nothing to gain from SSR, and keeping the server out of it avoids
// the SSR/client parity traps the courses listing hit.
//
// Not ported: the socket.io live push (`UserNotificationsEvent`) — that needs
// the socket client and SOCKET_URL wired up first.
import { defineStore } from 'pinia'
import { toNotification } from '~/types/notification'
import type {
  AppNotification,
  RawNotificationsBody,
  RawUnreadCountBody
} from '~/types/notification'

export const useNotificationsStore = defineStore('notifications', () => {
  const http = useHttp()
  const nuxtApp = useNuxtApp()

  const items = ref<AppNotification[]>([])
  const unreadCount = ref(0)
  const currentPage = ref(1)
  const totalPages = ref(1)
  const isLoading = ref(false)

  const hasMore = computed(() => currentPage.value < totalPages.value)

  function locale(): string {
    return (unref((nuxtApp.$i18n as { locale?: unknown } | undefined)?.locale) as string | undefined) ?? 'ar'
  }

  async function load(page: number): Promise<AppNotification[]> {
    const body = await http.get<RawNotificationsBody>(`${locale()}/notifications`, {
      query: { page },
      deserialize: false
    })
    const pagination = body?.meta?.[0]?.pagination
    currentPage.value = pagination?.current_page ?? page
    totalPages.value = pagination?.total_pages ?? 1
    return (body?.data?.notificationsData?.data ?? []).map(toNotification)
  }

  // Like the legacy header, a failed notifications call must not take the
  // page down with it — the http client already surfaces the error toast.
  async function fetchList() {
    isLoading.value = true
    try {
      items.value = await load(1)
    } catch {
      items.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function loadMore() {
    if (!hasMore.value || isLoading.value) return
    isLoading.value = true
    try {
      items.value = [...items.value, ...(await load(currentPage.value + 1))]
    } catch {
      totalPages.value = currentPage.value
    } finally {
      isLoading.value = false
    }
  }

  async function fetchUnreadCount() {
    try {
      const body = await http.get<RawUnreadCountBody>(`${locale()}/notifications/unread-count`, {
        deserialize: false
      })
      unreadCount.value = body?.data?.unread_count ?? 0
    } catch {
      unreadCount.value = 0
    }
  }

  /** Legacy only calls the endpoint for rows that aren't read yet. */
  async function markAsRead(notification: AppNotification) {
    if (notification.isRead || !notification.id) return
    await http.get(`${locale()}/notifications/mark-read/${notification.id}`, { deserialize: false })

    const row = items.value.find(n => n.id === notification.id)
    if (row) row.isRead = true
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  }

  return {
    items,
    unreadCount,
    isLoading,
    hasMore,
    fetchList,
    loadMore,
    fetchUnreadCount,
    markAsRead
  }
})
