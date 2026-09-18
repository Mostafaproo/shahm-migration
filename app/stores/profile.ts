import { defineStore } from 'pinia'
import { toUserProfile } from '~/types/profile'
import type { RawUserProfile, UserProfile } from '~/types/profile'

export interface ProfileFormValues {
  first_name: string
  last_name: string
}

export const useProfileStore = defineStore('profile', () => {
  const http = useHttp()
  const nuxtApp = useNuxtApp()
  const auth = useAuthStore()

  const profile = ref<UserProfile | null>(null)
  const isLoading = ref(false)
  const isSaving = ref(false)
  const isUploading = ref(false)
  const isChangingPassword = ref(false)

  /** Media id from the last successful avatar upload, sent as `attach_media`. */
  const pendingMediaId = ref<number | null>(null)

  function locale(): string {
    return (unref((nuxtApp.$i18n as { locale?: unknown } | undefined)?.locale) as string | undefined) ?? 'ar'
  }

  /** Absolute base for uploads; falls back to the normal API base. */
  function uploadBase(): string {
    const env = (nuxtApp.$tenant as { env?: Record<string, string | null> } | undefined)?.env
    return (env?.UPLAOAD_URL || env?.BASE_URL || '').replace(/\/$/, '')
  }

  async function fetchProfile() {
    isLoading.value = true
    try {
      const res = await http.get<{ data?: RawUserProfile }>(`${locale()}/profile`)
      profile.value = res?.data ? toUserProfile(res.data) : null
      pendingMediaId.value = null
    } catch {
      profile.value = null
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Legacy `saveImage`: crop → blob → `media[]` FormData → the new media's id,
   * which is only attached to the user on the next profile save.
   */
  async function uploadAvatar(file: File): Promise<string | null> {
    isUploading.value = true
    try {
      const form = new FormData()
      form.append('media[]', file, file.name)

      const res = await http.post<{ data?: unknown }>(
        `${uploadBase()}/${locale()}/media`,
        form,
        { serialize: false }
      )

      // A one-item collection: deserialized collections stay double-nested,
      // but tolerate a bare resource too.
      const payload = (res?.data as { data?: unknown } | undefined)?.data ?? res?.data
      const first = Array.isArray(payload) ? payload[0] : payload
      const media = first as { id?: string | number, url?: string } | undefined
      if (media?.id == null) return null

      pendingMediaId.value = Number(media.id)
      return media.url ?? null
    } catch {
      return null
    } finally {
      isUploading.value = false
    }
  }

  /**
   * Legacy `onSubmit`. The body is hand-built because this endpoint needs a
   * JSON:API *relationship* (`attach_media`), which the default request
   * serializer doesn't emit — it only produces flat `attributes`.
   */
  async function updateProfile(values: ProfileFormValues): Promise<boolean> {
    isSaving.value = true
    try {
      const attributes: Record<string, unknown> = {
        first_name: values.first_name,
        last_name: values.last_name,
        email: profile.value?.email ?? '',
        mobile: profile.value?.mobile ?? '',
        language: locale()
      }

      const mediaId = pendingMediaId.value
      // Legacy: with no new upload it explicitly clears `profile_picture`,
      // otherwise it sends the media as a relationship + included resource.
      if (mediaId == null) attributes.profile_picture = null

      const body = {
        data: {
          type: 'user',
          id: null,
          attributes,
          ...(mediaId != null && {
            relationships: {
              attach_media: { data: [{ type: 'attach_media', id: String(mediaId) }] }
            }
          })
        },
        ...(mediaId != null && {
          included: [{ type: 'attach_media', id: String(mediaId) }]
        })
      }

      const res = await http.post<{ data?: RawUserProfile, meta?: { message?: string } }>(
        `${uploadBase()}/${locale()}/profile/update-profile`,
        body,
        { serialize: false }
      )

      if (res?.data) profile.value = toUserProfile(res.data)
      pendingMediaId.value = null

      // Keep the navbar avatar/name in step with what was just saved.
      await auth.refreshUser()

      const message = serverMessage(res)
      if (message) nuxtApp.$appToast.success(message)
      return true
    } catch {
      // The http client already surfaced the backend's own error toast.
      return false
    } finally {
      isSaving.value = false
    }
  }

  async function changePassword(values: {
    old_password: string
    password: string
    password_confirmation: string
  }): Promise<boolean> {
    isChangingPassword.value = true
    try {
      const res = await http.post<{ meta?: { message?: string } }>(
        `${locale()}/profile/update-password`,
        { type: 'user', id: profile.value?.id ?? 'null', payload: values }
      )
      const message = serverMessage(res)
      if (message) nuxtApp.$appToast.success(message)
      return true
    } catch {
      return false
    } finally {
      isChangingPassword.value = false
    }
  }

  return {
    profile,
    isLoading,
    isSaving,
    isUploading,
    isChangingPassword,
    pendingMediaId,
    fetchProfile,
    uploadAvatar,
    updateProfile,
    changePassword
  }
})
