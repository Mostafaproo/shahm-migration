
export type HttpMethod
  = | 'GET'
    | 'POST'
    | 'PUT'
    | 'PATCH'
    | 'DELETE'
    | 'HEAD'


export interface BackendAction {
  endpoint_url: string

  method: HttpMethod

  label?: string

  key?: string

  action_type?: string

  bg_color?: string
}


export type ActionMap = Record<string, BackendAction>

export interface IPagination {
  count: number // items in the current page
  current_page: number
  per_page: number
  total: number // total items across all pages
  total_pages: number
}

/**
 * Metadata envelope the backend attaches to every list response.
 */
export interface ListMeta {
  pagination?: IPagination
  /** Backend-dictated, context-aware actions available for this resource list. */
  defaultActions?: ActionMap
  /** Wire-format alias — some services emit snake_case. Normalize on read. */
  default_actions?: ActionMap
}

/**
 * Canonical envelope for a paginated list response.
 */
export interface PaginatedResponse<T> {
  data: T[]
  meta: ListMeta
}

export interface MutationResponse<T, M = unknown> {
  data: T
  meta?: M
}
