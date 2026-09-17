export interface MediaFile {
  id: string
  fileName: string
  createdAt: string
  url: string
  /** Short label for the file-type chip, e.g. `PDF`. */
  extension: string
}

export interface RawMediaFile {
  id?: string | number
  file_name?: string
  created_at?: string
  url?: string
  extension?: string
  icon?: string
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
    extension: (extension ?? '').toUpperCase()
  }
}

/**
 * One entry of the file-type dropdown. The legacy digs these out of the list
 * response's `meta.filters`, picking the entry whose `name == 'extension'`.
 */
export interface MediaFilterOption {
  key: string
  value: string
}

export interface RawMetaFilter {
  name?: string
  data?: { key?: string | number, value?: string }[]
}

export function readExtensionFilters(filters?: RawMetaFilter[]): MediaFilterOption[] {
  const entry = (filters ?? []).find(f => f.name === 'extension')
  return (entry?.data ?? []).map(o => ({
    key: String(o.key ?? ''),
    value: o.value ?? ''
  }))
}
