export interface TimeRecord {
  id: string
  date: string
  project: string
  hours: number
  note: string
  createdAt: string
}

export interface LeaveRequest {
  id: string
  startDate: string
  endDate: string
  type: '年假' | '病假' | '事假'
  reason: string
  status: '待审批' | '已通过' | '已拒绝'
  createdAt: string
}

export interface DailyHours {
  date: string
  hours: number
}

export interface Summary {
  totalHours: number
  avgDailyHours: number
  attendanceDays: number
  leaveDays: number
  dailyHours: DailyHours[]
  periodLabel: string
}
