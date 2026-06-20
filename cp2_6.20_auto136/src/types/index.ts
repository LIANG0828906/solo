export type ClubCategory = 'academic' | 'sports' | 'art' | 'public'
export type ActivityFrequency = 'weekly' | 'biweekly' | 'monthly'
export type ApplicationStatus = 'pending' | 'approved' | 'rejected'

export interface Club {
  id: number
  name: string
  logo: string
  summary: string
  description: string
  category: ClubCategory
  frequency: ActivityFrequency
  memberCount: number
  maxMembers: number
  requiresApplication: boolean
  cover: string
}

export interface Activity {
  id: number
  clubId: number
  name: string
  date: string
  location: string
}

export interface Member {
  id: number
  name: string
  avatar: string
}

export interface Application {
  id: number
  clubId: number
  status: ApplicationStatus
  appliedAt: string
  reason?: string
  club?: Club
}

export interface ClubDetail extends Club {
  activities: Activity[]
  members: Member[]
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}
