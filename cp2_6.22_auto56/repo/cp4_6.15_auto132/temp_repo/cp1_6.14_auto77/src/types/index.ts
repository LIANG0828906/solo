export interface User {
  id: string
  name: string
  role: 'bride' | 'groom' | 'bestman' | 'bridesmaid' | 'planner'
  avatar?: string
}

export interface Wedding {
  id: string
  brideName: string
  groomName: string
  weddingDate: string
  venue: string
  createdAt: string
  invitationTheme: InvitationTheme
  invitationMessage: string
}

export interface Todo {
  id: string
  title: string
  completed: boolean
  createdAt: string
  completedAt?: string
  assigneeId?: string
  assigneeName?: string
}

export interface TimelineItem {
  id: string
  title: string
  time: string
  duration: number
  personInCharge: string
  notes: string
  icon: string
  color: string
  order: number
}

export interface Guest {
  id: string
  name: string
  phone: string
  companions: number
  rsvp: 'pending' | 'confirmed' | 'declined'
  tableNumber?: number
  seatNumber?: number
  addedBy: string
  addedByName: string
  createdAt: string
}

export interface Activity {
  id: string
  userId: string
  userName: string
  userRole: string
  action: string
  detail: string
  timestamp: string
  color: string
}

export type InvitationTheme = 'garden' | 'classic' | 'modern'

export interface Invitation {
  id: string
  weddingId: string
  theme: InvitationTheme
  brideName: string
  groomName: string
  weddingDate: string
  venue: string
  message: string
  shareUrl: string
}
