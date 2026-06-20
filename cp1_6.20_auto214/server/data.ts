import { v4 as uuidv4 } from 'uuid'

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

export const users: User[] = [
  { id: 'user-1', name: '张三', avatar: '👨' },
  { id: 'user-2', name: '李四', avatar: '👩' },
  { id: 'user-3', name: '王五', avatar: '🧑' }
]

const categories = ['食品', '日用品', '饮料', '生鲜', '零食', '洗护']

function generatePurchaseRecords(userId: string, days: number = 30): PurchaseRecord[] {
  const records: PurchaseRecord[] = []
  const now = new Date()
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    const purchaseCount = Math.random() > 0.3 ? Math.floor(Math.random() * 3) + 1 : 0
    
    for (let j = 0; j < purchaseCount; j++) {
      records.push({
        id: uuidv4(),
        userId,
        date: dateStr,
        amount: Math.floor(Math.random() * 300) + 20,
        category: categories[Math.floor(Math.random() * categories.length)]
      })
    }
  }
  
  return records
}

export const activities: Activity[] = [
  {
    id: uuidv4(),
    name: '满100减20大促',
    type: 'full_reduction',
    startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    rules: { fullAmount: 100, reductionAmount: 20 }
  },
  {
    id: uuidv4(),
    name: '全场8折优惠',
    type: 'discount',
    startTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    rules: { discountRate: 0.8 }
  },
  {
    id: uuidv4(),
    name: '买牛奶送面包',
    type: 'buy_gift',
    startTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    rules: { giftName: '全麦面包' }
  }
]

export const purchaseRecords: PurchaseRecord[] = [
  ...generatePurchaseRecords('user-1'),
  ...generatePurchaseRecords('user-2'),
  ...generatePurchaseRecords('user-3')
]

export const coupons: Coupon[] = []

export function getActivityStatus(activity: Activity): ActivityStatus {
  const now = Date.now()
  const start = new Date(activity.startTime).getTime()
  const end = new Date(activity.endTime).getTime()
  
  if (now < start) return 'not_started'
  if (now > end) return 'ended'
  return 'ongoing'
}

export function getActivityRuleSummary(activity: Activity): string {
  switch (activity.type) {
    case 'full_reduction':
      return `满${activity.rules.fullAmount}元减${activity.rules.reductionAmount}元`
    case 'discount':
      return `打${(activity.rules.discountRate! * 10).toFixed(1)}折`
    case 'buy_gift':
      return `买指定商品送${activity.rules.giftName}`
  }
}
