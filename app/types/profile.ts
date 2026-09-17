export interface UserProfile {
  id: string
  firstName: string
  lastName: string
  email: string
  mobile: string
  profilePicture: string | null
  walletAmount: string | null
  userType: string
}

export interface RawUserProfile {
  id?: string | number
  first_name?: string
  last_name?: string
  name?: string
  email?: string
  mobile?: string
  profile_picture?: string
  wallet_amount?: string | number
  user_type?: string
}

/** Splits a computed full name into first + rest, the way the backend joins it. */
function splitName(name: string): [string, string] {
  const trimmed = name.trim()
  if (!trimmed) return ['', '']
  const gap = trimmed.indexOf(' ')
  return gap === -1 ? [trimmed, ''] : [trimmed.slice(0, gap), trimmed.slice(gap + 1)]
}

export function toUserProfile(raw: RawUserProfile): UserProfile {
  const [fallbackFirst, fallbackLast] = splitName(raw.name ?? '')

  return {
    id: String(raw.id ?? ''),
    firstName: raw.first_name ?? fallbackFirst,
    lastName: raw.last_name ?? fallbackLast,
    email: raw.email ?? '',
    mobile: raw.mobile ?? '',
    profilePicture: raw.profile_picture || null,
    walletAmount: raw.wallet_amount != null ? String(raw.wallet_amount) : null,
    userType: raw.user_type ?? ''
  }
}
