export interface PollOption {
  id: string
  text: string
  votes: number
}

export interface PollParticipant {
  id: string
  name: string
  votedOptionIds: string[]
}

export interface Poll {
  id: string
  title: string
  description: string
  options: PollOption[]
  participants: PollParticipant[]
  isMultiSelect: boolean
  isAnonymous: boolean
  createdAt: string
  expiresAt: string | null
  status: 'active' | 'closed'
  code: string
  creatorId: string
}

export interface CreatePollRequest {
  title: string
  description: string
  options: string[]
  isMultiSelect: boolean
  isAnonymous: boolean
  expiresAt: string | null
  creatorName: string
}
