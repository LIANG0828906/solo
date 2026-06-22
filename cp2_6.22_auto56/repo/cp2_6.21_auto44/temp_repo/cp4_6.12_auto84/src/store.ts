import { create } from 'zustand'
import flowersData from './data/flowers.json'

export interface Flower {
  id: number
  name: string
  price: number
  description: string
  ingredients: string[]
  imageUrl: string
}

export interface CartItem extends Flower {
  quantity: number
}

interface FlowerStore {
  flowers: Flower[]
  cartItems: CartItem[]
  addToCart: (flower: Flower) => void
  removeFromCart: (id: number) => void
  updateQuantity: (id: number, quantity: number) => void
  clearCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
}

export const useFlowerStore = create<FlowerStore>((set, get) => ({
  flowers: flowersData as Flower[],
  cartItems: [],

  addToCart: (flower: Flower) => {
    const existing = get().cartItems.find((item) => item.id === flower.id)
    if (existing) {
      set({
        cartItems: get().cartItems.map((item) =>
          item.id === flower.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ),
      })
    } else {
      set({
        cartItems: [...get().cartItems, { ...flower, quantity: 1 }],
      })
    }
  },

  removeFromCart: (id: number) => {
    set({
      cartItems: get().cartItems.filter((item) => item.id !== id),
    })
  },

  updateQuantity: (id: number, quantity: number) => {
    if (quantity <= 0) {
      get().removeFromCart(id)
      return
    }
    set({
      cartItems: get().cartItems.map((item) =>
        item.id === id ? { ...item, quantity } : item
      ),
    })
  },

  clearCart: () => {
    set({ cartItems: [] })
  },

  getTotalItems: () => {
    return get().cartItems.reduce((sum, item) => sum + item.quantity, 0)
  },

  getTotalPrice: () => {
    return get().cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    )
  },
}))
