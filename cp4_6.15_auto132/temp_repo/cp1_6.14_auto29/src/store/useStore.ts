// 数据流向：
// api/utils → zustand store → React components
// 组件通过调用 store 的 action 触发 API 请求
// API 返回数据后更新 store，订阅 store 的组件自动重渲染

import { create } from 'zustand'
import { getPoints, getProducts, exchange } from '@/utils/api'
import type {
  User,
  Product,
  WeekPoints,
  MonthPoints,
  ExchangeRecord,
} from '@/types'

interface ToastState {
  show: boolean
  message: string
  type: 'success' | 'error'
}

interface StoreState {
  user: User | null
  products: Product[]
  weekPoints: WeekPoints | null
  monthPoints: MonthPoints | null
  history: ExchangeRecord[]
  toast: ToastState
  fetchPointsData: () => Promise<void>
  fetchProducts: () => Promise<void>
  submitExchange: (productId: string, quantity: number) => Promise<boolean>
  setUserAvatar: (dataUrl: string) => void
  showToast: (message: string, type: 'success' | 'error') => void
  hideToast: () => void
}

export const useStore = create<StoreState>((set, get) => ({
  user: null,
  products: [],
  weekPoints: null,
  monthPoints: null,
  history: [],
  toast: {
    show: false,
    message: '',
    type: 'success' as const,
  },

  fetchPointsData: async () => {
    try {
      const response = await getPoints()
      if (response.success && response.data) {
        set({
          user: response.data.user,
          weekPoints: response.data.weekPoints,
          monthPoints: response.data.monthPoints,
          history: response.data.history,
        })
      }
    } catch {
      get().showToast('获取积分数据失败', 'error')
    }
  },

  fetchProducts: async () => {
    try {
      const response = await getProducts()
      if (response.success && response.data) {
        set({ products: response.data })
      }
    } catch {
      get().showToast('获取商品列表失败', 'error')
    }
  },

  submitExchange: async (productId: string, quantity: number) => {
    try {
      const response = await exchange({ productId, quantity })
      if (response.success && response.data) {
        const { record, remainingPoints, remainingStock } = response.data

        set((state) => {
          const updatedUser = state.user
            ? { ...state.user, totalPoints: remainingPoints }
            : null

          const updatedProducts = state.products.map((p) =>
            p.id === productId ? { ...p, stock: remainingStock } : p
          )

          const updatedHistory = [record, ...state.history]

          return {
            user: updatedUser,
            products: updatedProducts,
            history: updatedHistory,
          }
        })

        get().showToast(response.message || '兑换成功', 'success')
        return true
      } else {
        get().showToast(response.message || '兑换失败', 'error')
        return false
      }
    } catch {
      get().showToast('兑换失败：网络错误', 'error')
      return false
    }
  },

  setUserAvatar: (dataUrl: string) => {
    set((state) => ({
      user: state.user ? { ...state.user, avatar: dataUrl } : state.user,
    }))
  },

  showToast: (message: string, type: 'success' | 'error') => {
    set({
      toast: {
        show: true,
        message,
        type,
      },
    })
  },

  hideToast: () => {
    set((state) => ({
      toast: {
        ...state.toast,
        show: false,
      },
    }))
  },
}))
