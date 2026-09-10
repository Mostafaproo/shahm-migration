// app/utils/dataTable.ts
export type DataTableCellType
  = | 'auto' // sniff the runtime value (default)
    | 'text'
    | 'number'
    | 'boolean'
    | 'date'
    | 'relation' // { data: resource } → display name
    | 'relations' // { data: resource[] } → joined display names

export interface DataTableColumn<Row = Record<string, any>> {
  /**
   * Value path on the row. Supports dot-paths through resolved relationships,
   * e.g. "title", "subject.data.name", "avg". Also used as the cell slot
   * suffix (#cell-<key>) and as the server sort field for sortable columns.
   */
  key: string
  /** Header caption (already-translated string). */
  label: string
  /** Enables the header sort toggle; emits the column key. */
  sortable?: boolean
  /** Rendering hint when the default formatter is used. */
  cellType?: DataTableCellType
  /** Custom raw-value extractor (wins over `key` path resolution). */
  accessor?: (row: Row) => unknown
  /** Custom display formatter (wins over the default type-based one). */
  format?: (value: unknown, row: Row) => string
  /** Extra classes for both header and body cells (e.g. widths, alignment). */
  class?: string
}

// ── Structural mirrors of the core/http contracts ──────────────────────────
export interface TableAction {
  endpoint_url: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  label?: string
  key: string
  action_type?: string
  bg_color?: string
}

export type TableActionMap = Record<string, TableAction>

/** Nuxt UI semantic color names accepted by the action buttons (kept as a
 *  plain union so this module stays import-free of @nuxt/ui). */
export type TableActionColor
  = | 'primary'
    | 'secondary'
    | 'success'
    | 'info'
    | 'warning'
    | 'error'
    | 'neutral'

/**
 * Per-`key` override for a row action in AppCrudDataTable. All fields optional
 * — set only what you need to change for that key.
 */
export interface RowActionOverride<Row> {
  icon?: string
  color?: string
  /** Replaces the backend's `action.label` for this key. Omit to keep it. */
  label?: string
  /** Show this action as an inline icon button instead of in the "⋮" dropdown. Default false. */
  inline?: boolean
  /** false = don't call the endpoint automatically; nothing runs unless `onClick` is also given. Default true. */
  autoExecute?: boolean
  /** If given, runs INSTEAD of the endpoint call — regardless of autoExecute. */
  onClick?: (row: Row) => void
  /** Completely hide this action from both the inline buttons and the ⋮ dropdown. */
  hide?: boolean
  /** Render this action only for rows where the predicate holds. */
  when?: (row: Row) => boolean
}

export type RowActionOverrideEntry<Row>
  = | RowActionOverride<Row>
    | RowActionOverride<Row>[]

export interface ResolvedRowAction<Row> {
  /** Stable per-row key: the backend action key plus the override's index. */
  id: string
  action: TableAction
  override?: RowActionOverride<Row>
}

export interface DefaultActionConfig {
  key: string
  icon?: string
  color?: TableActionColor
  autoExecute?: boolean
}

/** Structural twin of IPagination. */
export interface TablePagination {
  count: number
  current_page: number
  per_page: number
  total: number
  total_pages: number
}

/** Structural twin of ListSource (useDynamicCrud). */
export type TableListSource = TableAction | string

/** Structural twin of FetchListOptions (useDynamicCrud). */
export interface TableFetchListOptions {
  query?: Record<string, unknown>
  params?: Partial<{
    page: string
    perPage: string
    search: string
    sortBy: string
    sortOrder: string
  }>
}

/**
 * The store surface AppCrudDataTable consumes. A `useDynamicCrud()` return
 * value (optionally spread into a domain store) satisfies this structurally.
 */
export interface DataTableStoreLike<Row = Record<string, any>> {
  rows: Row[]
  isLoading: boolean
  error: string | null
  executing: string | null
  pagination: TablePagination | null
  defaultActions: TableActionMap
  /** Untouched list meta (e.g. `.filters` for AppDynamicFilters). */
  rawMeta: Record<string, unknown>
  page: number
  perPage: number | null
  sortBy: string | null
  sortOrder: 'asc' | 'desc'
  search: string
  /** Active filter values sent as query params on each list request. */
  filters: Record<string, unknown>
  total: number
  totalPages: number
  setPage: (p: number) => Promise<void>
  setPerPage: (n: number) => Promise<void>
  setSort: (field: string) => Promise<void>
  setSearch: (term: string) => Promise<void>
  setFilters: (next: Record<string, unknown>) => Promise<void>
  fetchList: (source?: TableListSource, options?: TableFetchListOptions) => Promise<void>
  executeMutation: (action: TableAction) => Promise<unknown>
  /** Seeds page/sort/search/filters from the current URL query — call once, before the first fetchList. */
  initFromUrlQuery: () => void
}

/** Relationship wrapper sniffing: `{ data: ... }` with no other payload keys. */
export function isRelationshipWrapper(value: unknown): value is { data: unknown } {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
  const keys = Object.keys(value as object).filter(k => k !== 'links' && k !== 'meta')
  return keys.length === 1 && keys[0] === 'data'
}

/** Human display name for a resolved resource object. */
export function displayName(resource: unknown): string {
  if (resource === null || resource === undefined) return ''
  if (typeof resource !== 'object') return String(resource)
  const r = resource as Record<string, unknown>
  for (const k of ['name', 'title', 'label', 'key']) {
    if (typeof r[k] === 'string' && r[k]) return r[k] as string
  }
  return typeof r.id === 'string' ? (r.id as string) : ''
}

/** Dot-path getter that auto-unwraps `{ data: ... }` relationship wrappers. */
export function resolveCellValue(row: unknown, path: string): unknown {
  let current: unknown = row
  for (const segment of path.split('.')) {
    if (current === null || current === undefined) return undefined
    // Transparently step through relationship wrappers so "subject.name"
    // works even when the row actually holds "subject.data.name".
    if (segment !== 'data' && isRelationshipWrapper(current)) {
      current = (current as { data: unknown }).data
      if (current === null || current === undefined) return undefined
    }
    current = (current as Record<string, unknown>)[segment]
  }
  return current
}

const DATE_LIKE = /^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2}(:\d{2})?)?/

/** True when a string looks like an ISO-ish backend date ("2026-06-29 02:15:00"). */
export function isDateLike(value: unknown): value is string {
  return typeof value === 'string' && DATE_LIKE.test(value)
}

export function formatDate(value: string, locale = 'en'): string {
  const date = new Date(value.replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return value
  const hasTime = /\d{2}:\d{2}/.test(value)
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    ...(hasTime ? { timeStyle: 'short' } : {})
  }).format(date)
}

/**
 * Default cell display for every supported data type. Returns a STRING —
 * richer visuals (badges, icons) are the table component's/slots' job.
 */
export function formatCellValue(
  value: unknown,
  opts: { locale?: string, cellType?: DataTableCellType } = {}
): string {
  const { locale = 'en', cellType = 'auto' } = opts

  // Unwrap relationship wrappers first, whatever the declared type.
  if (isRelationshipWrapper(value)) value = value.data

  if (value === null || value === undefined || value === '') return '—'

  switch (cellType) {
    case 'date':
      return typeof value === 'string' ? formatDate(value, locale) : String(value)
    case 'relation':
      return displayName(value) || '—'
    case 'relations':
      return Array.isArray(value) && value.length
        ? value.map(displayName).filter(Boolean).join('، ')
        : '—'
    case 'boolean':
    case 'number':
    case 'text':
      return String(value)
  }

  // auto
  if (typeof value === 'boolean') return String(value)
  if (typeof value === 'number') return new Intl.NumberFormat(locale).format(value)
  if (isDateLike(value)) return formatDate(value, locale)
  if (Array.isArray(value)) {
    if (!value.length) return '—'
    return value.map(displayName).filter(Boolean).join('، ') || String(value.length)
  }
  if (typeof value === 'object') return displayName(value) || '—'
  return String(value)
}
