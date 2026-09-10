// Ported from ouredu-lms-monorepo's packages/core/http/types/JsonApi.d.ts.

export interface JsonApiInput {
  type: string
  id?: string
  payload?: Record<string, any>
}

export interface JsonApiPayloadWithRel {
  type: string
  id?: string
  payload: {
    attributes?: Record<string, any>
    relationships?: Record<string, any>
    included?: Array<Record<string, any>>
  }
}

export interface JsonApiResponseRaw {
  data: {
    data: any
    meta?: Record<string, any>
  }
}

export interface FormattedResponse<T = any> {
  data?: T
  meta?: Record<string, any>
}

// ── Deserialized (post-Formatter) shapes ────────────────────────────────────

/** A single flattened resource. Attributes are merged onto the object itself. */
export interface DeserializedResource {
  id: string
  type: string
  /** Names of the relations present on this resource (sarala quirk). */
  relationships?: string[]
  links?: Record<string, any>
  meta?: Record<string, any>
  [attribute: string]: any
}

/** A resolved to-one relationship, as it appears on a deserialized row. */
export interface ToOne<T extends DeserializedResource = DeserializedResource> {
  data: T | null
}

/** A resolved to-many relationship, as it appears on a deserialized row. */
export interface ToMany<T extends DeserializedResource = DeserializedResource> {
  data: T[]
}

/**
 * A deserialized COLLECTION document — deserialize() returns the whole
 * document for lists, with `data` replaced by the flattened rows.
 */
export interface DeserializedCollection<
  T extends DeserializedResource = DeserializedResource
> {
  data: T[]
  included?: unknown[]
  meta?: Record<string, any>
  links?: Record<string, any>
}

/** HttpClient response for a JSON:API LIST endpoint (deserialize: true). */
export type ListResponse<T extends DeserializedResource = DeserializedResource>
  = FormattedResponse<DeserializedCollection<T>>

/** HttpClient response for a JSON:API SINGLE-resource endpoint. */
export type SingleResponse<T extends DeserializedResource = DeserializedResource>
  = FormattedResponse<T>
