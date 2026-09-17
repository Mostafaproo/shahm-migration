export type CertificateType = 'course' | 'pathway'

export interface Certificate {
  id: string
  name: string
  issuedAt: string
  fileUrl: string
}

export interface RawCertificate {
  id?: string | number
  name?: string
  created_at?: string
  certificate_file?: string
}

export function formatIssuedDate(value: string): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${day}-${month}-${date.getFullYear()}`
}

export function toCertificate(raw: RawCertificate): Certificate {
  return {
    id: String(raw.id ?? ''),
    name: raw.name ?? '',
    issuedAt: formatIssuedDate(raw.created_at ?? ''),
    fileUrl: raw.certificate_file ?? ''
  }
}

/** The API's own name for each type. */
export function certificateTypeParam(type: CertificateType): string {
  return type === 'course' ? 'course' : 'learning_path'
}

/** An entry in the second dropdown (a subscribed course or pathway). */
export interface CertifiableOption {
  id: string
  name: string
}

export interface RawCertifiableOption {
  id?: string | number
  name?: string
}

export function toCertifiableOption(raw: RawCertifiableOption): CertifiableOption {
  return {
    id: String(raw.id ?? ''),
    name: raw.name ?? ''
  }
}
