import { defineStore } from 'pinia'
import { toSiteConfig } from '~/types/siteConfig'
import type { RawConfigRow, SiteConfig } from '~/types/siteConfig'

export interface ContactFormValues {
  first_name: string
  last_name: string
  email: string
  mobile: string
  message: string
}

export const useContactStore = defineStore('contact', () => {
  const http = useHttp()
  const nuxtApp = useNuxtApp()

  const config = ref<SiteConfig>({})
  const isLoadingConfig = ref(false)
  const isSubmitting = ref(false)
  /** The backend's own success text, which the legacy shows in place of the form. */
  const successMessage = ref('')

  function locale(): string {
    return (unref((nuxtApp.$i18n as { locale?: unknown } | undefined)?.locale) as string | undefined) ?? 'ar'
  }

  async function fetchConfig() {
    // Config rarely changes and the page re-mounts often — skip a repeat fetch.
    if (Object.keys(config.value).length) return
    isLoadingConfig.value = true
    try {
      const res = await http.get<{ data?: RawConfigRow[] | { data?: RawConfigRow[] } }>(
        `${locale()}/landing-page/config`
      )
      const doc = res?.data
      const rows = Array.isArray(doc) ? doc : (doc?.data ?? [])
      config.value = toSiteConfig(rows)
    } catch {
      config.value = {}
    } finally {
      isLoadingConfig.value = false
    }
  }

  async function submit(values: ContactFormValues): Promise<boolean> {
    isSubmitting.value = true
    try {
      const res = await http.post<{ meta?: { message?: string } }>(
        `${locale()}/contact/create`,
        { type: 'contact', id: 'null', payload: values }
      )
      // Legacy swaps the whole form out for the backend's message.
      successMessage.value = res?.meta?.message || ' '
      return true
    } catch {
      // The http client already surfaced the error toast.
      return false
    } finally {
      isSubmitting.value = false
    }
  }

  function reset() {
    successMessage.value = ''
  }

  return { config, isLoadingConfig, isSubmitting, successMessage, fetchConfig, submit, reset }
})
