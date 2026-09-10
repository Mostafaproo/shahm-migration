export * from './settings-gate'
export * from './client'
export * from './errors'
export * from './jsonApi'
// Backend-dictated CRUD contract types (explicit re-export — `HttpMethod`
// would collide with client.ts under a star export).
export type {
  BackendAction,
  ActionMap,
  IPagination,
  ListMeta,
  PaginatedResponse
} from './types/api-action'
