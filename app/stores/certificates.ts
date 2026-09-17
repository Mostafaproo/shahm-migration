import { defineStore } from 'pinia'
import { certificateTypeParam, toCertifiableOption, toCertificate } from '~/types/certificate'
import type {
  Certificate,
  CertifiableOption,
  CertificateType,
  RawCertifiableOption,
  RawCertificate
} from '~/types/certificate'

export const useCertificatesStore = defineStore('certificates', () => {
  const http = useHttp()
  const nuxtApp = useNuxtApp()

  const items = ref<Certificate[]>([])
  const isLoading = ref(false)
  const emptyMessage = ref('')

  const type = ref<CertificateType | null>(null)
  const certifiableId = ref<string | null>(null)

  const courses = ref<CertifiableOption[]>([])
  const pathways = ref<CertifiableOption[]>([])

  function locale(): string {
    return (unref((nuxtApp.$i18n as { locale?: unknown } | undefined)?.locale) as string | undefined) ?? 'ar'
  }

  async function fetchList() {
    isLoading.value = true
    emptyMessage.value = ''
    try {
      const res = await http.get<{
        data?: RawCertificate[] | { data?: RawCertificate[] }
        meta?: { message?: string }
      }>(`${locale()}/student/certificate`, {
        query: {
          ...(type.value ? { certificate_type: certificateTypeParam(type.value) } : {}),
          ...(certifiableId.value ? { certifiable_id: certifiableId.value } : {})
        }
      })

      const doc = res?.data
      const rows = Array.isArray(doc) ? doc : (doc?.data ?? [])
      items.value = rows.map(toCertificate)
      if (!items.value.length) emptyMessage.value = res?.meta?.message ?? ''
    } catch {
      // The http client already surfaced the error toast.
      items.value = []
    } finally {
      isLoading.value = false
    }
  }

  /** Changing the type clears the second dropdown, exactly like the legacy. */
  async function setType(next: CertificateType | null) {
    type.value = next
    certifiableId.value = null
    await fetchList()
  }

  async function setCertifiable(next: string | null) {
    certifiableId.value = next
    await fetchList()
  }

  async function fetchOptions(includePathways: boolean) {
    const requests: Promise<void>[] = [
      http
        .get<{ data?: RawCertifiableOption[] | { data?: RawCertifiableOption[] } }>(
          `${locale()}/student/courses`,
          { query: { subscribed: 1, pluck: 1 } }
        )
        .then((res) => {
          const doc = res?.data
          const rows = Array.isArray(doc) ? doc : (doc?.data ?? [])
          courses.value = rows.map(toCertifiableOption)
        })
        .catch(() => {
          courses.value = []
        })
    ]

    if (includePathways) {
      requests.push(
        http
          .get<{ data?: RawCertifiableOption[] | { data?: RawCertifiableOption[] } }>(
            `${locale()}/student/learning-paths`,
            { query: { subscribed: 1, pluck: 1 } }
          )
          .then((res) => {
            const doc = res?.data
            const rows = Array.isArray(doc) ? doc : (doc?.data ?? [])
            pathways.value = rows.map(toCertifiableOption)
          })
          .catch(() => {
            pathways.value = []
          })
      )
    }

    await Promise.all(requests)
  }

  return {
    items,
    isLoading,
    emptyMessage,
    type,
    certifiableId,
    courses,
    pathways,
    fetchList,
    setType,
    setCertifiable,
    fetchOptions
  }
})
