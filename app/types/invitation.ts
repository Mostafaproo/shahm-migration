export const INVITATION_RELATIONS = {
  parents: 'parents',
  sent: 'parentSentInvitation',
  received: 'parentsReceivedInvitations'
} as const

export type InvitationRelation = typeof INVITATION_RELATIONS[keyof typeof INVITATION_RELATIONS]

/** A linked parent, or the other party on an invitation — same fields. */
export interface InvitationPerson {
  id: string
  name: string
  avatar: string | null
}

export interface RawPerson {
  id?: string | number
  name?: string
  profile_picture?: string
}

export interface RawInvitation {
  id?: string | number
  /** Present on SENT invitations — who it went to. */
  receiver?: { data?: RawPerson }
  /** Present on RECEIVED invitations — who sent it. */
  sender?: { data?: RawPerson }
}

export function toPerson(raw: RawPerson): InvitationPerson {
  return {
    id: String(raw.id ?? ''),
    name: raw.name ?? '',
    avatar: raw.profile_picture || null
  }
}

/**
 * An invitation row, flattened to "the other person" — the tab already says
 * whether that's the receiver (sent) or the sender (received), so the template
 * doesn't need to branch.
 */
export interface Invitation {
  id: string
  person: InvitationPerson
}

export function toInvitation(raw: RawInvitation): Invitation {
  const person = raw.receiver?.data ?? raw.sender?.data ?? {}
  return {
    id: String(raw.id ?? ''),
    person: toPerson(person)
  }
}

export type InvitationStatus = 'accepted' | 'refused'
