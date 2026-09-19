
export const CKEDITOR_CDN_URL = 'https://cdn.ckeditor.com/4.14.0/full-all/ckeditor.js'

export interface CkEditorNamespace {
  replace: (el: HTMLElement, config?: Record<string, unknown>) => CkEditorInstance
  config: Record<string, unknown>
  plugins: { addExternal: (name: string, path: string, file?: string) => void }
  instances: Record<string, CkEditorInstance>
  on?: (event: string, cb: () => void) => void
}

export interface CkEditorInstance {
  setData: (value: string) => void
  getData: () => string
  on: (event: string, cb: () => void) => void
  destroy: (noUpdate?: boolean) => void
  name: string
}

declare global {
  interface Window {
    CKEDITOR?: CkEditorNamespace
  }
}

let pending: Promise<CkEditorNamespace> | null = null

export function useCkEditorLoader() {
  function load(url: string = CKEDITOR_CDN_URL): Promise<CkEditorNamespace> {
    if (import.meta.server) {
      return Promise.reject(new Error('CKEditor is client-only'))
    }
    if (window.CKEDITOR) return Promise.resolve(window.CKEDITOR)
    if (pending) return pending

    pending = new Promise<CkEditorNamespace>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(`script[src="${url}"]`)
      const script = existing ?? document.createElement('script')

      script.addEventListener('load', () => {
        if (window.CKEDITOR) resolve(window.CKEDITOR)
        else reject(new Error('CKEditor loaded but CKEDITOR global is missing'))
      })
      script.addEventListener('error', () => {
        pending = null
        reject(new Error(`Failed to load CKEditor from ${url}`))
      })

      if (!existing) {
        script.src = url
        script.async = true
        document.head.appendChild(script)
      }
    })

    return pending
  }

  return { load, CKEDITOR_CDN_URL }
}
