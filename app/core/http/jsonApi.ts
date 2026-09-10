import { Formatter } from './saralaFormatter'
import type {
  JsonApiInput,
  JsonApiPayloadWithRel,
  JsonApiResponseRaw,
  FormattedResponse
} from './types/JsonApi'

// Keep the types reachable from `~/core/http` alongside the functions.
export type {
  JsonApiInput,
  JsonApiPayloadWithRel,
  JsonApiResponseRaw,
  FormattedResponse,
  DeserializedResource,
  DeserializedCollection,
  ToOne,
  ToMany,
  ListResponse,
  SingleResponse
} from './types/JsonApi'

/**
 * Serializes standard data payloads into basic JSON:API structures.
 * Applied automatically by the HttpClient `request` unless the caller
 * passes `serialize: false`.
 */
export const serializeReq = (data: JsonApiInput) => {
  const { payload, id = 'null', type } = data

  return {
    data: {
      type,
      id,
      attributes: {
        ...payload
      }
    }
  }
}

/**
 * Serializes complex models containing nested relationships and included schemas.
 */
export const serializeReqRelInc = (data: JsonApiPayloadWithRel) => {
  const { payload, id = 'null', type } = data
  const { attributes, relationships, included } = payload

  return {
    data: {
      type,
      id,
      attributes: {
        ...attributes
      },
      ...(relationships && { relationships })
    },
    ...(included && { included })
  }
}

/**
 * Deserializes deeply nested JSON:API standard structures back to linear front-end objects.
 */
export const deSerializeRes = <T = any>({ data }: JsonApiResponseRaw): FormattedResponse<T> => {
  const formatter = new Formatter()
  const meta = data?.meta

  return {
    ...(data?.data && { data: formatter.deserialize(data) as T }),
    ...(meta && { meta })
  }
}
