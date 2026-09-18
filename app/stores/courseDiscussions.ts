import { defineStore } from 'pinia'
import { toDiscussion, toDiscussionReply } from '~/types/courseDiscussion'
import type {
  Discussion,
  RawDiscussionReply,
  RawDiscussionRoom,
  RawRepliesPage
} from '~/types/courseDiscussion'

export const useCourseDiscussionsStore = defineStore('courseDiscussions', () => {
  const http = useHttp()
  const nuxtApp = useNuxtApp()

  const courseId = ref('')
  const discussions = ref<Discussion[]>([])
  const page = ref(1)
  const totalPages = ref(1)

  /** The backend can mute one student inside a single course's room. */
  const isUserActive = ref(true)
  /** Once the course has ended the room goes read-only. */
  const isEnded = ref(false)

  const isLoading = ref(false)
  const isSubmitting = ref(false)
  /** Keyed by `discussion:<id>` / `reply:<id>` so each row spins on its own. */
  const busyRows = ref<Set<string>>(new Set())

  const hasMore = computed(() => page.value < totalPages.value)
  const canPost = computed(() => isUserActive.value && !isEnded.value)

  function locale(): string {
    return (unref((nuxtApp.$i18n as { locale?: unknown } | undefined)?.locale) as string | undefined) ?? 'ar'
  }

  function isBusy(key: string): boolean {
    return busyRows.value.has(key)
  }

  async function withRowBusy<T>(key: string, fn: () => Promise<T>): Promise<T | undefined> {
    if (busyRows.value.has(key)) return
    busyRows.value = new Set(busyRows.value).add(key)
    try {
      return await fn()
    } catch {
      // The http client already surfaced the error toast.
      return undefined
    } finally {
      const next = new Set(busyRows.value)
      next.delete(key)
      busyRows.value = next
    }
  }

  async function load(targetPage: number): Promise<Discussion[]> {
    const res = await http.get<{ data?: RawDiscussionRoom }>(
      `${locale()}/discussions/${courseId.value}`,
      { query: { 'discussion-page': targetPage } }
    )
    const body = res?.data
    if (!body) return []

    if (body.is_user_active != null) isUserActive.value = Boolean(body.is_user_active)
    if (body.is_ended != null) isEnded.value = Boolean(body.is_ended)
    page.value = body.pagination?.current_page ?? targetPage
    totalPages.value = body.pagination?.total_pages ?? 1

    return (body.discussions?.data ?? []).map(toDiscussion)
  }

  async function fetchList(id: string) {
    courseId.value = id
    isLoading.value = true
    try {
      discussions.value = await load(1)
    } catch {
      discussions.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function loadMore() {
    if (!hasMore.value || isLoading.value) return
    isLoading.value = true
    try {
      discussions.value = [...discussions.value, ...(await load(page.value + 1))]
    } catch {
      // Freeze the "load more" button rather than retrying forever.
      totalPages.value = page.value
    } finally {
      isLoading.value = false
    }
  }

  /** Legacy: after asking, the whole list is reloaded from page 1. */
  async function ask(body: string): Promise<boolean> {
    if (!body.trim() || !canPost.value) return false
    isSubmitting.value = true
    try {
      // `id` is omitted so the serializer sends the "null" placeholder this
      // backend expects on creates — same as the verified login call.
      await http.post(`${locale()}/discussions/${courseId.value}`, {
        type: 'discussion',
        payload: { body }
      })
      discussions.value = await load(1)
      return true
    } catch {
      return false
    } finally {
      isSubmitting.value = false
    }
  }

  /** Legacy: the new reply is unshifted locally, no refetch. */
  async function reply(discussionId: string, comment: string): Promise<boolean> {
    if (!comment.trim() || !canPost.value) return false
    isSubmitting.value = true
    try {
      const res = await http.post<{ data?: RawDiscussionReply }>(
        `${locale()}/discussions/${discussionId}/comments`,
        { type: 'discussion_comments', payload: { comment } }
      )
      const row = discussions.value.find(d => d.id === discussionId)
      if (row && res?.data) {
        row.replies.unshift(toDiscussionReply(res.data))
      } else if (row) {
        // The legacy just drops the reply when the create response carries no
        // resource, which reads as "my comment disappeared". Re-read that one
        // discussion's replies instead — the surrounding list stays untouched.
        await refreshReplies(row)
      }
      return true
    } catch {
      return false
    } finally {
      isSubmitting.value = false
    }
  }

  async function fetchReplies(discussionId: string, targetPage: number) {
    const res = await http.get<{ data?: RawRepliesPage }>(
      `${locale()}/discussions/${discussionId}/show`,
      { query: { 'discussion-comment-page': targetPage } }
    )
    const body = res?.data
    return {
      replies: (body?.comments?.data ?? []).map(toDiscussionReply),
      page: body?.pagination?.current_page ?? targetPage,
      totalPages: body?.pagination?.total_pages
    }
  }

  /** Replaces a discussion's replies with the first page, keeping the list. */
  async function refreshReplies(row: Discussion) {
    const { replies, page: current, totalPages: total } = await fetchReplies(row.id, 1)
    row.replies = replies
    row.repliesPage = current
    row.repliesTotalPages = total ?? row.repliesTotalPages
  }

  async function loadMoreReplies(discussionId: string) {
    const row = discussions.value.find(d => d.id === discussionId)
    if (!row || row.repliesPage >= row.repliesTotalPages) return

    await withRowBusy(`replies:${discussionId}`, async () => {
      const { replies, page: current, totalPages: total } = await fetchReplies(
        discussionId,
        row.repliesPage + 1
      )
      row.repliesPage = current
      row.repliesTotalPages = total ?? row.repliesTotalPages
      row.replies.push(...replies)
    })
  }

  async function editDiscussion(id: string, body: string): Promise<boolean> {
    if (!body.trim()) return false
    const done = await withRowBusy(`discussion:${id}`, async () => {
      await http.put(`${locale()}/discussions/${id}/update-discussion`, {
        type: 'discussion',
        id,
        payload: { body }
      })
      const row = discussions.value.find(d => d.id === id)
      if (row) row.body = body
      return true
    })
    return done ?? false
  }

  async function editReply(discussionId: string, replyId: string, comment: string): Promise<boolean> {
    if (!comment.trim()) return false
    const done = await withRowBusy(`reply:${replyId}`, async () => {
      await http.put(`${locale()}/discussions/${replyId}/update-comment`, {
        type: 'discussion_comments',
        id: replyId,
        payload: { comment }
      })
      const row = discussions.value
        .find(d => d.id === discussionId)?.replies
        .find(r => r.id === replyId)
      if (row) row.comment = comment
      return true
    })
    return done ?? false
  }

  async function removeDiscussion(id: string, endpointUrl: string) {
    await withRowBusy(`discussion:${id}`, async () => {
      await http.delete(endpointUrl)
      discussions.value = discussions.value.filter(d => d.id !== id)
    })
  }

  async function removeReply(discussionId: string, replyId: string, endpointUrl: string) {
    await withRowBusy(`reply:${replyId}`, async () => {
      await http.delete(endpointUrl)
      const row = discussions.value.find(d => d.id === discussionId)
      if (row) row.replies = row.replies.filter(r => r.id !== replyId)
    })
  }

  async function toggleStudentActive(endpointUrl: string) {
    await withRowBusy(`toggle:${endpointUrl}`, async () => {
      const res = await http.get(endpointUrl)
      const message = serverMessage(res)
      if (message) nuxtApp.$appToast.success(message)
      discussions.value = await load(1)
    })
  }

  // Named `reset`, not `$reset`: setup stores don't get a built-in `$reset`,
  // and shadowing Pinia's throwing stub would depend on its merge order.
  function reset() {
    courseId.value = ''
    discussions.value = []
    page.value = 1
    totalPages.value = 1
    isUserActive.value = true
    isEnded.value = false
    busyRows.value = new Set()
  }

  return {
    discussions,
    isUserActive,
    isEnded,
    isLoading,
    isSubmitting,
    hasMore,
    canPost,
    isBusy,
    fetchList,
    loadMore,
    ask,
    reply,
    loadMoreReplies,
    editDiscussion,
    editReply,
    removeDiscussion,
    removeReply,
    toggleStudentActive,
    reset
  }
})
