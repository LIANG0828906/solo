import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { get as idbGet, set as idbSet } from 'idb-keyval'
import { addMonths, addQuarters, addYears, differenceInDays, format, parseISO, startOfMonth, subMonths } from 'date-fns'
import type { Subscription, BillingCycle, UIState } from './types'

interface SubscriptionStore {
  subscriptions: Subscription[]
  ui: UIState
  isLoaded: boolean
  hydrate: () => Promise<void>
  persist: () => Promise<void>
  addSubscription: (data: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateSubscription: (id: string, data: Partial<Subscription>) => void
  deleteSubscription: (id: string) => void
  setSearchQuery: (query: string) => void
  setSortOrder: (order: 'asc' | 'desc') => void
  toggleCompare: (id: string) => void
  clearCompare: () => void
  setExpandedCard: (id: string | null) => void
  setMobileMenuOpen: (open: boolean) => void
  getUpcomingRenewals: (days: number) => Subscription[]
  getMonthlyCost: () => number
  getFilteredSubscriptions: () => Subscription[]
  getMonthlyTrend: () => { month: string; total: number; services: { name: string; amount: number }[] }[]
  getCompareData: () => { service: string; fullMark: number; subject: string; value: number }[]
}

const getMonthlyAmount = (amount: number, cycle: BillingCycle): number => {
  switch (cycle) {
    case 'monthly': return amount
    case 'quarterly': return amount / 3
    case 'yearly': return amount / 12
  }
}

const defaultUI: UIState = {
  searchQuery: '',
  sortOrder: 'desc',
  compareList: [],
  expandedCardId: null,
  isMobileMenuOpen: false
}

const createSampleData = (): Subscription[] => {
  const now = new Date()
  return [
    {
      id: uuidv4(),
      name: 'Notion',
      amount: 96,
      billingCycle: 'yearly',
      nextBillingDate: format(addMonths(now, 3), 'yyyy-MM-dd'),
      status: 'active',
      notes: '团队协作知识库',
      usageFrequency: 8,
      satisfaction: 9,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    },
    {
      id: uuidv4(),
      name: 'GitHub Pro',
      amount: 40,
      billingCycle: 'monthly',
      nextBillingDate: format(addMonths(now, 1), 'yyyy-MM-dd'),
      status: 'active',
      notes: '代码托管平台',
      usageFrequency: 10,
      satisfaction: 8,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    },
    {
      id: uuidv4(),
      name: 'Figma',
      amount: 144,
      billingCycle: 'yearly',
      nextBillingDate: format(addMonths(now, 5), 'yyyy-MM-dd'),
      status: 'active',
      notes: 'UI设计工具',
      usageFrequency: 7,
      satisfaction: 9,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    },
    {
      id: uuidv4(),
      name: 'Spotify',
      amount: 15,
      billingCycle: 'monthly',
      nextBillingDate: format(addDays(now, 5), 'yyyy-MM-dd'),
      status: 'active',
      notes: '音乐流媒体',
      usageFrequency: 9,
      satisfaction: 8,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    },
    {
      id: uuidv4(),
      name: 'Adobe CC',
      amount: 888,
      billingCycle: 'yearly',
      nextBillingDate: format(addDays(now, 2), 'yyyy-MM-dd'),
      status: 'active',
      notes: '创意套件全家桶',
      usageFrequency: 6,
      satisfaction: 7,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    }
  ]
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export const useStore = create<SubscriptionStore>((set, get) => ({
  subscriptions: [],
  ui: defaultUI,
  isLoaded: false,

  hydrate: async () => {
    try {
      const stored = await idbGet('subscriptions') as Subscription[] | undefined
      if (stored && stored.length > 0) {
        set({ subscriptions: stored, isLoaded: true })
      } else {
        const sample = createSampleData()
        set({ subscriptions: sample, isLoaded: true })
        await idbSet('subscriptions', sample)
      }
    } catch {
      const sample = createSampleData()
      set({ subscriptions: sample, isLoaded: true })
    }
  },

  persist: async () => {
    await idbSet('subscriptions', get().subscriptions)
  },

  addSubscription: (data) => {
    const now = new Date().toISOString()
    const newSub: Subscription = {
      ...data,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now
    }
    set((state) => ({ subscriptions: [newSub, ...state.subscriptions] }))
    get().persist()
  },

  updateSubscription: (id, data) => {
    set((state) => ({
      subscriptions: state.subscriptions.map((s) =>
        s.id === id ? { ...s, ...data, updatedAt: new Date().toISOString() } : s
      )
    }))
    get().persist()
  },

  deleteSubscription: (id) => {
    set((state) => ({
      subscriptions: state.subscriptions.filter((s) => s.id !== id),
      ui: {
        ...state.ui,
        compareList: state.ui.compareList.filter((c) => c !== id)
      }
    }))
    get().persist()
  },

  setSearchQuery: (query) => set((state) => ({ ui: { ...state.ui, searchQuery: query } })),
  setSortOrder: (order) => set((state) => ({ ui: { ...state.ui, sortOrder: order } })),

  toggleCompare: (id) => {
    set((state) => {
      const list = state.ui.compareList.includes(id)
        ? state.ui.compareList.filter((c) => c !== id)
        : state.ui.compareList.length < 4
          ? [...state.ui.compareList, id]
          : state.ui.compareList
      return { ui: { ...state.ui, compareList: list } }
    })
  },

  clearCompare: () => set((state) => ({ ui: { ...state.ui, compareList: [] } })),
  setExpandedCard: (id) => set((state) => ({ ui: { ...state.ui, expandedCardId: id } })),
  setMobileMenuOpen: (open) => set((state) => ({ ui: { ...state.ui, isMobileMenuOpen: open } })),

  getUpcomingRenewals: (days) => {
    const now = new Date()
    return get().subscriptions
      .filter((s) => s.status === 'active')
      .filter((s) => {
        const diff = differenceInDays(parseISO(s.nextBillingDate), now)
        return diff >= 0 && diff <= days
      })
      .sort((a, b) => differenceInDays(parseISO(a.nextBillingDate), now) - differenceInDays(parseISO(b.nextBillingDate), now))
  },

  getMonthlyCost: () => {
    return get().subscriptions
      .filter((s) => s.status === 'active')
      .reduce((sum, s) => sum + getMonthlyAmount(s.amount, s.billingCycle), 0)
  },

  getFilteredSubscriptions: () => {
    const { subscriptions, ui } = get()
    let result = [...subscriptions]
    if (ui.searchQuery.trim()) {
      const q = ui.searchQuery.toLowerCase()
      result = result.filter(
        (s) => s.name.toLowerCase().includes(q) || s.notes.toLowerCase().includes(q)
      )
    }
    result.sort((a, b) => {
      const amountA = getMonthlyAmount(a.amount, a.billingCycle)
      const amountB = getMonthlyAmount(b.amount, b.billingCycle)
      return ui.sortOrder === 'asc' ? amountA - amountB : amountB - amountA
    })
    return result
  },

  getMonthlyTrend: () => {
    const { subscriptions } = get()
    const months: { month: string; total: number; services: { name: string; amount: number }[] }[] = []
    const now = new Date()

    for (let i = 11; i >= 0; i--) {
      const targetMonth = subMonths(now, i)
      const monthStart = startOfMonth(targetMonth)
      const monthLabel = format(monthStart, 'yyyy-MM')
      const monthServices: { name: string; amount: number }[] = []
      let total = 0

      subscriptions.forEach((s) => {
        if (s.status === 'cancelled') return
        const billingDate = parseISO(s.nextBillingDate)
        let checkDate = billingDate
        let found = false

        for (let j = 0; j < 24 && !found; j++) {
          if (checkDate >= monthStart && checkDate < addMonths(monthStart, 1)) {
            const amount = getMonthlyAmount(s.amount, s.billingCycle)
            total += amount
            monthServices.push({ name: s.name, amount: Math.round(amount * 100) / 100 })
            found = true
          }
          switch (s.billingCycle) {
            case 'monthly': checkDate = addMonths(checkDate, -1); break
            case 'quarterly': checkDate = addQuarters(checkDate, -1); break
            case 'yearly': checkDate = addYears(checkDate, -1); break
          }
        }
      })

      months.push({
        month: monthLabel,
        total: Math.round(total * 100) / 100,
        services: monthServices
      })
    }
    return months
  },

  getCompareData: () => {
    const { subscriptions, ui } = get()
    const selected = subscriptions.filter((s) => ui.compareList.includes(s.id))
    const result: { service: string; fullMark: number; subject: string; value: number }[] = []

    selected.forEach((s) => {
      const monthlyCost = getMonthlyAmount(s.amount, s.billingCycle)
      const maxCost = Math.max(...selected.map((x) => getMonthlyAmount(x.amount, x.billingCycle)), 1)
      const costScore = Math.round((monthlyCost / maxCost) * 10)

      result.push(
        { service: s.name, subject: '月费用', value: costScore, fullMark: 10 },
        { service: s.name, subject: '使用频率', value: s.usageFrequency, fullMark: 10 },
        { service: s.name, subject: '满意度', value: s.satisfaction, fullMark: 10 }
      )
    })
    return result
  }
}))

export { getMonthlyAmount }
