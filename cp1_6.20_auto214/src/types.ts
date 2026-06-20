export type ActivityType = 'full_reduction' | 'discount' | 'buy_gift'
export type ActivityStatus = 'ongoing' | 'not_started' | 'ended'

export interface Activity {
  id: string
  name: string
  type: ActivityType
  startTime: string
  endTime: string
  rules: {
    fullAmount?: number
    reductionAmount?: number
    discountRate?: number
    giftName?: string
  }
  status?: ActivityStatus
  ruleSummary?: string
}

export interface PurchaseRecord {
  id: string
  userId: string
  date: string
  amount: number
  category: string
}

export interface Coupon {
  id: string
  userId: string
  activityId: string
  activityName: string
  type: ActivityType
  denomination: number
  threshold: number
  giftName?: string
  expireTime: string
  used: boolean
  issuedAt: string
}

export interface User {
  id: string
  name: string
  avatar: string
}
