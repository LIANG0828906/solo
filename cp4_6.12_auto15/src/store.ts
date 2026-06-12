import { create } from 'zustand'
import axios from 'axios'
import type { CoffeeBean, Recipe, GreenBeanBatch, CartItem, RoastLevel, ControlPoint, SortField, SortOrder } from './types'

interface CoffeeState {
  coffeeBeans: CoffeeBean[]
  coffeeLoading: boolean
  selectedCoffee: CoffeeBean | null
  recipes: Recipe[]
  recipesLoading: boolean
  greenBeanBatches: GreenBeanBatch[]
  lowStockCount: number
  inventoryLoading: boolean
  cart: CartItem[]
  cartOpen: boolean
  notificationCount: number
  bannerVisible: boolean
  sortField: SortField
  sortOrder: SortOrder

  fetchCoffeeBeans: () => Promise<void>
  fetchCoffeeById: (id: number) => Promise<void>
  fetchRecipes: () => Promise<void>
  fetchGreenBeanBatches: () => Promise<void>
  addToCart: (coffee: CoffeeBean, roastLevel: RoastLevel) => void
  removeFromCart: (coffeeId: number, roastLevel: RoastLevel) => void
  updateCartQuantity: (coffeeId: number, roastLevel: RoastLevel, quantity: number) => void
  setCartOpen: (open: boolean) => void
  setBannerVisible: (visible: boolean) => void
  setSort: (field: SortField) => void
  clearCart: () => void

  createRecipe: (data: {
    name: string
    beanOrigin: string
    beanBatchId: number
    greenBeanWeight: number
    roastedBeanWeight: number
    controlPoints: ControlPoint[]
  }) => Promise<number>
  updateRecipe: (id: number, data: any) => Promise<void>
  deleteRecipe: (id: number) => Promise<void>
  checkout: (customerName: string) => Promise<number>
}

export const useCoffeeStore = create<CoffeeState>((set, get) => ({
  coffeeBeans: [],
  coffeeLoading: false,
  selectedCoffee: null,
  recipes: [],
  recipesLoading: false,
  greenBeanBatches: [],
  lowStockCount: 0,
  inventoryLoading: false,
  cart: [],
  cartOpen: false,
  notificationCount: 0,
  bannerVisible: true,
  sortField: 'receiveDate',
  sortOrder: 'desc',

  fetchCoffeeBeans: async () => {
    set({ coffeeLoading: true })
    const res = await axios.get('/api/coffee-beans?limit=20')
    set({ coffeeBeans: res.data.data, coffeeLoading: false })
  },

  fetchCoffeeById: async (id: number) => {
    const res = await axios.get(`/api/coffee-beans/${id}`)
    set({ selectedCoffee: res.data })
  },

  fetchRecipes: async () => {
    set({ recipesLoading: true })
    const res = await axios.get('/api/recipes')
    set({ recipes: res.data, recipesLoading: false })
  },

  fetchGreenBeanBatches: async () => {
    const { sortField, sortOrder } = get()
    set({ inventoryLoading: true })
    const res = await axios.get(`/api/green-bean-batches?sortBy=${sortField}&sortOrder=${sortOrder}`)
    set({
      greenBeanBatches: res.data.data,
      lowStockCount: res.data.lowStockCount,
      notificationCount: res.data.lowStockCount,
      inventoryLoading: false,
    })
  },

  addToCart: (coffee, roastLevel) => {
    const { cart } = get()
    const existing = cart.find(c => c.coffeeId === coffee.id && c.roastLevel === roastLevel)
    if (existing) {
      set({
        cart: cart.map(c =>
          c.coffeeId === coffee.id && c.roastLevel === roastLevel
            ? { ...c, quantity: c.quantity + 1 }
            : c
        ),
      })
    } else {
      set({
        cart: [...cart, {
          coffeeId: coffee.id,
          coffeeName: coffee.name,
          roastLevel,
          quantity: 1,
          price: coffee.price,
        }],
      })
    }
    set({ cartOpen: true })
  },

  removeFromCart: (coffeeId, roastLevel) => {
    set({ cart: get().cart.filter(c => !(c.coffeeId === coffeeId && c.roastLevel === roastLevel)) })
  },

  updateCartQuantity: (coffeeId, roastLevel, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(coffeeId, roastLevel)
      return
    }
    set({
      cart: get().cart.map(c =>
        c.coffeeId === coffeeId && c.roastLevel === roastLevel
          ? { ...c, quantity }
          : c
      ),
    })
  },

  setCartOpen: (open) => set({ cartOpen: open }),
  setBannerVisible: (visible) => set({ bannerVisible: visible }),

  setSort: (field) => {
    const { sortField, sortOrder } = get()
    const newOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc'
    set({ sortField: field, sortOrder: newOrder })
    get().fetchGreenBeanBatches()
  },

  clearCart: () => set({ cart: [] }),

  createRecipe: async (data) => {
    const res = await axios.post('/api/recipes', data)
    get().fetchRecipes()
    get().fetchGreenBeanBatches()
    return res.data.id
  },

  updateRecipe: async (id, data) => {
    await axios.put(`/api/recipes/${id}`, data)
    get().fetchRecipes()
  },

  deleteRecipe: async (id) => {
    await axios.delete(`/api/recipes/${id}`)
    get().fetchRecipes()
  },

  checkout: async (customerName) => {
    const { cart } = get()
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const res = await axios.post('/api/orders', { items: cart, total, customerName })
    set({ cart: [], cartOpen: false })
    get().fetchCoffeeBeans()
    return res.data.id
  },
}))
