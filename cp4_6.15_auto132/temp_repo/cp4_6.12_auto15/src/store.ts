import { create } from 'zustand'
import axios from 'axios'
import type { CoffeeBean, CartItem, Recipe, GreenBeanBatch, RoastLevel } from './types'

interface CoffeeStore {
  coffeeBeans: CoffeeBean[]
  cart: CartItem[]
  cartOpen: boolean
  recipes: Recipe[]
  greenBeanBatches: GreenBeanBatch[]
  lowStockCount: number

  fetchCoffeeBeans: () => Promise<void>
  addToCart: (coffee: CoffeeBean, roastLevel: RoastLevel) => void
  removeFromCart: (coffeeId: number, roastLevel: RoastLevel) => void
  updateCartQuantity: (coffeeId: number, roastLevel: RoastLevel, quantity: number) => void
  toggleCart: () => void
  fetchRecipes: () => Promise<void>
  fetchGreenBeanBatches: () => Promise<void>
}

export const useCoffeeStore = create<CoffeeStore>((set, get) => ({
  coffeeBeans: [],
  cart: [],
  cartOpen: false,
  recipes: [],
  greenBeanBatches: [],
  lowStockCount: 0,

  fetchCoffeeBeans: async () => {
    const res = await axios.get('/api/coffee-beans')
    set({ coffeeBeans: res.data.data || res.data })
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

  toggleCart: () => {
    set({ cartOpen: !get().cartOpen })
  },

  fetchRecipes: async () => {
    const res = await axios.get('/api/recipes')
    set({ recipes: res.data.data || res.data })
  },

  fetchGreenBeanBatches: async () => {
    const res = await axios.get('/api/green-bean-batches')
    set({
      greenBeanBatches: res.data.data || res.data,
      lowStockCount: res.data.lowStockCount || 0,
    })
  },
}))
