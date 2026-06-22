export type BillingCycle = 'monthly' | 'quarterly' | 'yearly'
export type ServiceStatus = 'active' | 'paused' | 'cancelled'

export interface Subscription {
  id: string
  name: string
  amount: number
  billingCycle: BillingCycle
  nextBillingDate: string
  status: ServiceStatus
  notes: string
  usageFrequency: number
  satisfaction: number
  createdAt: string
  updatedAt: string
}

export interface UIState {
  searchQuery: string
  sortOrder: 'asc' | 'desc'
  compareList: string[]
  expandedCardId: string | null
  isMobileMenuOpen: boolean
}
