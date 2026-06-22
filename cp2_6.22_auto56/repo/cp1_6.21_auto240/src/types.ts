export type EmailCategory = 'work' | 'social' | 'promo' | 'spam'
export type EmailStatus = 'pending' | 'processing' | 'done'

export interface Email {
  id: string
  from: string
  subject: string
  body: string
  timestamp: string
  category: EmailCategory
  status: EmailStatus
}

export interface DailyStats {
  date: string
  count: number
}

export interface CategoryStats {
  category: EmailCategory
  count: number
}

export interface StatsResponse {
  daily: DailyStats[]
  byCategory: CategoryStats[]
  total: number
  done: number
}

export const CATEGORY_LABELS: Record<EmailCategory, string> = {
  work: '工作',
  social: '社交',
  promo: '促销',
  spam: '垃圾',
}

export const CATEGORY_COLORS: Record<EmailCategory, string> = {
  work: '#3B82F6',
  social: '#10B981',
  promo: '#F59E0B',
  spam: '#EF4444',
}

export const STATUS_LABELS: Record<EmailStatus, string> = {
  pending: '待处理',
  processing: '处理中',
  done: '已完成',
}
