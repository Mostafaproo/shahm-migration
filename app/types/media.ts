export interface MediaAction {
  key: string
  method: string
  endpointUrl: string
}

export interface MediaFile {
  id: string
  fileName: string
  createdAt: string
  url: string
  /** Short label for the file-type chip, e.g. `PDF`. */
  extension: string
  /** Instructor view only: whether students can see the file. */
  active: boolean
  /** Media-library only: which course the file hangs off. */
  courseTitle: string
  downloadsCount: number
  actions: MediaAction[]
}

export interface RawMediaFile {
  id?: string | number
  file_name?: string
  created_at?: string
  url?: string
  extension?: string
  icon?: string
  active?: boolean
  course_title?: string
  downloads_count?: number | string
  actions?: { data?: { key?: string, method?: string, endpoint_url?: string }[] }
}

/** Mirrors the legacy `getFileTypeText`: prefer the icon hint, else the suffix. */
const ICON_EXTENSIONS: Record<string, string> = {
  'file-pdf': 'pdf',
  'file-alt': 'doc',
  'file-word': 'doc',
  'image': 'img',
  'video': 'mp4',
  'volume-up': 'mp3'
}

export function toMediaFile(raw: RawMediaFile): MediaFile {
  const fileName = raw.file_name ?? ''
  const extension = raw.extension
    || (raw.icon ? ICON_EXTENSIONS[raw.icon] : undefined)
    || (fileName.includes('.') ? fileName.split('.').pop() : '')

  return {
    id: String(raw.id ?? ''),
    fileName,
    createdAt: raw.created_at ?? '',
    url: raw.url ?? '',
    extension: (extension ?? '').toUpperCase(),
    active: Boolean(raw.active),
    courseTitle: raw.course_title ?? '',
    downloadsCount: Number(raw.downloads_count ?? 0) || 0,
    actions: (raw.actions?.data ?? []).map(a => ({
      key: a.key ?? '',
      method: (a.method ?? 'GET').toUpperCase(),
      endpointUrl: a.endpoint_url ?? ''
    }))
  }
}

export function detachAction(file: MediaFile): MediaAction | undefined {
  return file.actions.find(a => a.key === 'detach-media')
}

export interface MediaFilterOption {
  key: string
  value: string
}

export interface RawMetaFilter {
  name?: string
  data?: { key?: string | number, value?: string }[]
}

export function readMetaFilter(filters: RawMetaFilter[] | undefined, name: string): MediaFilterOption[] {
  const entry = (filters ?? []).find(f => f.name === name)
  return (entry?.data ?? []).map(o => ({
    key: String(o.key ?? ''),
    value: o.value ?? ''
  }))
}
