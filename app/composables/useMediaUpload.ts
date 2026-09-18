/**
 * The shared media upload transport.
 *
 * Every upload in the product goes to the same place — `POST {uploadBase}/{locale}/media`
 * with the file under `media[]` — and comes back with a media id that the
 * caller then attaches to whatever owns it (a course, a session, a user).
 * That split is the legacy's too: `DragAndDropUploader.submitFiles()` uploads
 * first and attaches second, so a failed attach never loses the upload.
 *
 * This uses XMLHttpRequest rather than `$fetch`, because the legacy shows a
 * live percentage and lets the user cancel mid-flight, and the fetch API can
 * report neither for a request body. The tenant interceptor on `$fetch` is not
 * a loss here: it only stamps `X-Tenant-ID` on auth and translation URLs.
 */
export interface MediaUploadHandle {
  /** Resolves with the new media's id, or null when it failed or was aborted. */
  done: Promise<string | null>
  abort: () => void
}

interface RawUploadedMedia {
  id?: string | number
}

/** The upload endpoint answers with a one-item JSON:API collection. */
function readMediaId(body: unknown): string | null {
  const doc = body as { data?: RawUploadedMedia[] | { data?: RawUploadedMedia[] } } | undefined
  const rows = Array.isArray(doc?.data) ? doc.data : doc?.data?.data
  const id = rows?.[0]?.id
  return id == null ? null : String(id)
}

export function useMediaUpload() {
  const nuxtApp = useNuxtApp()
  const auth = useAuthStore()

  function locale(): string {
    return (unref((nuxtApp.$i18n as { locale?: unknown } | undefined)?.locale) as string | undefined) ?? 'ar'
  }

  /** Uploads have their own base URL on some tenants; fall back to the API one. */
  function uploadBase(): string {
    const env = (nuxtApp.$tenant as { env?: Record<string, string | null> } | undefined)?.env
    return (env?.UPLAOAD_URL || env?.BASE_URL || '').replace(/\/$/, '')
  }

  function upload(file: File, onProgress?: (percent: number) => void): MediaUploadHandle {
    const xhr = new XMLHttpRequest()

    const done = new Promise<string | null>((resolve) => {
      xhr.open('POST', `${uploadBase()}/${locale()}/media`)

      const token = auth.token || useCookie<string | null>('shaham_session').value
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      xhr.setRequestHeader('Accept', 'application/vnd.api+json')
      xhr.setRequestHeader('Accept-Language', locale())
      // Deliberately no Content-Type: the browser has to set it itself so the
      // multipart `boundary=...` parameter is generated. Same trap the http
      // client documents for FormData bodies.

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100))
      }

      xhr.onload = () => {
        if (xhr.status < 200 || xhr.status >= 300) {
          readErrors(xhr.responseText).forEach(msg => nuxtApp.$appToast.error(msg))
          resolve(null)
          return
        }
        try {
          resolve(readMediaId(JSON.parse(xhr.responseText)))
        } catch {
          resolve(null)
        }
      }

      // A cancel is the user's own doing, so it stays silent; a network failure
      // is not, and the caller surfaces it.
      xhr.onabort = () => resolve(null)
      xhr.onerror = () => resolve(null)

      const form = new FormData()
      form.append('media[]', file, file.name)
      xhr.send(form)
    })

    return { done, abort: () => xhr.abort() }
  }

  return { upload }
}

/** JSON:API error documents carry the readable text in `errors[].detail`. */
function readErrors(responseText: string): string[] {
  try {
    const body = JSON.parse(responseText) as { errors?: { detail?: string }[] }
    return (body.errors ?? []).map(e => e.detail).filter((d): d is string => Boolean(d))
  } catch {
    return []
  }
}
