export type PointType = 'supply' | 'camp'

export type MemberStatus = 'moving' | 'resting' | 'trouble'

export interface RoutePoint {
  id: string
  name: string
  lat: number
  lng: number
  elevation: number
  eta: string
  type: PointType
  hasWater?: boolean
  hasShelter?: boolean
  order: number
}

export interface RouteData {
  id: string
  code: string
  name: string
  description?: string
  points: RoutePoint[]
  totalDistance: number
  totalDuration: number
  createdAt: string
}

export interface TeamMember {
  id: string
  routeId: string
  name: string
  lat: number
  lng: number
  status: MemberStatus
  lastUpdated: string
  nearestPointId?: string
  progress: number
}

export interface TeamData {
  members: TeamMember[]
  totalMembers: number
  arrivedMembers: number
  averageProgress: number
  heatmapData: [number, number, number][]
}

export interface PointUpdatePayload {
  pointId: string
  updates: Partial<RoutePoint>
}
