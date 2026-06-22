export type FacilityType = '长椅' | '路灯' | '垃圾桶' | '健身器材'
export type ReportStatus = '已提交' | '处理中' | '已完成'

export interface StatusRecord {
  status: ReportStatus
  timestamp: string
}

export interface Report {
  id: string
  facilityType: FacilityType
  description: string
  image?: string
  lat: number
  lng: number
  createdAt: string
  status: ReportStatus
  statusHistory: StatusRecord[]
}

export interface ReportsResponse {
  reports: Report[]
  total: number
  page: number
  totalPages: number
}

export interface QueryParams {
  type?: FacilityType
  status?: ReportStatus
  page?: number
  limit?: number
}

export const FACILITY_COLORS: Record<FacilityType, string> = {
  '长椅': '#4CAF50',
  '路灯': '#FFC107',
  '垃圾桶': '#2196F3',
  '健身器材': '#9C27B0'
}

export const STATUS_COLORS: Record<ReportStatus, string> = {
  '已提交': '#9E9E9E',
  '处理中': '#FFC107',
  '已完成': '#4CAF50'
}
