import { defineStore } from 'pinia'
import { INVITATION_RELATIONS, toInvitation, toPerson } from '~/types/invitation'
import type {
  Invitation,
  InvitationPerson,
  InvitationRelation,
  InvitationStatus,
  RawInvitation,
  RawPerson
} from '~/types/invitation'

interface RawProfileInclude {
  data?: {
    student?: {
      data?: {
        parents?: { data?: RawPerson[] }
        parentSentInvitation?: { data?: RawInvitation[] }
        parentsReceivedInvitations?: { data?: RawInvitation[] }
      }
    }
  }
}

export const useInvitationsStore = defineStore('invitations', () => {
  const http = useHttp()
  const nuxtApp = useNuxtApp()

  const parents = ref<InvitationPerson[]>([])
  const sent = ref<Invitation[]>([])
  const received = ref<Invitation[]>([])

  const isLoading = ref(false)
  /** Keyed per row (`cancel:<id>`, `accepted:<id>`, …) so each button spins alone. */
  const busyRows = ref<Set<string>>(new Set())

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

  async function fetchRelation(relation: InvitationRelation) {
    isLoading.value = true
    try {
      const res = await http.get<RawProfileInclude>(`${locale()}/profile`, {
        query: { include: `student.${relation}` }
      })
      const student = res?.data?.student?.data

      if (relation === INVITATION_RELATIONS.parents) {
        parents.value = (student?.parents?.data ?? []).map(toPerson)
      } else if (relation === INVITATION_RELATIONS.sent) {
        sent.value = (student?.parentSentInvitation?.data ?? []).map(toInvitation)
      } else {
        received.value = (student?.parentsReceivedInvitations?.data ?? []).map(toInvitation)
      }
    } catch {
      if (relation === INVITATION_RELATIONS.parents) parents.value = []
      else if (relation === INVITATION_RELATIONS.sent) sent.value = []
      else received.value = []
    } finally {
      isLoading.value = false
    }
  }

  function toastMessage(res: { meta?: { message?: string } } | undefined) {
    if (res?.meta?.message) nuxtApp.$appToast.success(res.meta.message)
  }

  /**
   * Legacy calls this with a GET — `profile/{id}/remove-relation` — even though
   * it deletes. Kept as-is because that is what the backend accepts.
   */
  async function removeParent(parentId: string): Promise<boolean> {
    const done = await withRowBusy(`remove:${parentId}`, async () => {
      const res = await http.get<{ meta?: { message?: string } }>(
        `${locale()}/profile/${parentId}/remove-relation`
      )
      toastMessage(res)
      await fetchRelation(INVITATION_RELATIONS.parents)
      return true
    })
    return done ?? false
  }

  async function sendInvitation(email: string): Promise<boolean> {
    const done = await withRowBusy('send', async () => {
      const res = await http.post<{ meta?: { message?: string } }>(
        `${locale()}/invitations/invite`,
        undefined,
        { query: { email, type: 'parent', abilities_user: true } }
      )
      toastMessage(res)
      await fetchRelation(INVITATION_RELATIONS.sent)
      return true
    })
    return done ?? false
  }

  async function resendInvitation(id: string): Promise<boolean> {
    const done = await withRowBusy(`resend:${id}`, async () => {
      const res = await http.post<{ meta?: { message?: string } }>(
        `${locale()}/invitations/${id}/resend-invite`,
        undefined,
        { query: { abilities_user: true } }
      )
      toastMessage(res)
      return true
    })
    return done ?? false
  }

  async function cancelInvitation(id: string): Promise<boolean> {
    const done = await withRowBusy(`cancel:${id}`, async () => {
      const res = await http.post<{ meta?: { message?: string } }>(
        `${locale()}/invitations/${id}/cancel`
      )
      toastMessage(res)
      await fetchRelation(INVITATION_RELATIONS.sent)
      return true
    })
    return done ?? false
  }

  /**
   * Accept or refuse. Legacy refreshes the PARENTS list after an accept (the
   * new parent belongs there now) and the received list after a refusal.
   */
  async function changeStatus(id: string, status: InvitationStatus): Promise<boolean> {
    const done = await withRowBusy(`${status}:${id}`, async () => {
      const res = await http.post<{ meta?: { message?: string } }>(
        `${locale()}/invitations/${id}/change-status`,
        undefined,
        { query: { status } }
      )
      toastMessage(res)
      await fetchRelation(
        status === 'accepted' ? INVITATION_RELATIONS.parents : INVITATION_RELATIONS.received
      )
      return true
    })
    return done ?? false
  }

  return {
    parents,
    sent,
    received,
    isLoading,
    isBusy,
    fetchRelation,
    removeParent,
    sendInvitation,
    resendInvitation,
    cancelInvitation,
    changeStatus
  }
})
