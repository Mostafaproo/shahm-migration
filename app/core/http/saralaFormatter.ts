/** The subset of sarala's Formatter API we rely on. */
// @ts-expect-error — no published type declarations for this dependency.
import { Formatter as UntypedFormatter } from 'sarala-json-api-data-formatter'

export interface JsonApiFormatter {
  /** Restrict which relations are resolved (default: all). */
  includeOnly(includes?: string[]): this
  /** Restrict which attribute fields are kept per type (default: all). */
  filterFields(fields?: Record<string, string[]>): this
  /**
   * Flatten a JSON:API document. Collections return the WHOLE document with
   * `data` replaced by flattened rows; single resources return the bare
   * flattened object. Relations stay wrapped as `{ data: … }`.
   */
  deserialize(data: unknown): any
  /** Inverse transform: front-end objects → JSON:API document. */
  serialize(data: unknown): any
}

export const Formatter = UntypedFormatter as new () => JsonApiFormatter
