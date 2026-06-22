export const COLOR_PALETTE = [
  '#FFD6E0',
  '#D4E6F1',
  '#D5F5E3',
  '#E8DAEF',
  '#FADBD8',
  '#FEF9E7',
]

export const MAX_MEMBERS = 6
export const TOTAL_ROUNDS = 3
export const MIN_WORDS = 100
export const MAX_WORDS = 500
export const TURN_TIMEOUT_MS = 5 * 60 * 1000

export interface Member {
  id: string
  nickname: string
  color: string
  joinedAt: number
}

export interface Paragraph {
  id: string
  memberId: string
  content: string
  round: number
  submittedAt: number
}

export interface RoomState {
  id: string
  name: string
  members: Member[]
  paragraphs: Paragraph[]
  currentWriterIndex: number
  currentRound: number
  totalRounds: number
  maxMembers: number
  status: 'waiting' | 'writing' | 'completed'
  turnDeadline?: number
  createdAt: number
}

export type ClientMessage =
  | { type: 'join'; roomId: string; nickname: string }
  | { type: 'submit'; roomId: string; content: string }
  | { type: 'ping' }

export type ServerMessage =
  | { type: 'roomState'; state: RoomState }
  | { type: 'memberJoined'; member: Member }
  | { type: 'memberLeft'; memberId: string }
  | { type: 'turnChanged'; currentWriterId: string; deadline: number }
  | { type: 'paragraphSubmitted'; paragraph: Paragraph; member: Member }
  | { type: 'storyComplete'; state: RoomState }
  | { type: 'memberSkipped'; memberId: string; reason: string }
  | { type: 'error'; message: string }
  | { type: 'roomsList'; rooms: RoomState[] }
