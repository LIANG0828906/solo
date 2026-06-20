import { create } from 'zustand'

export interface EventData {
  id: string
  name: string
  description: string
  date: string
  venue: string
  rows: number
  cols: number
  price: number
  seats: { row: number; col: number; status: 'available' | 'sold' | 'reserved' }[][]
  createdAt: string
}

export interface OrderData {
  id: string
  eventId: string
  seats: { row: number; col: number }[]
  totalPrice: number
  createdAt: string
}

interface AppState {
  events: EventData[]
  orders: OrderData[]
  loading: boolean
  fetchEvents: () => Promise<void>
  fetchEvent: (id: string) => Promise<EventData | null>
  createEvent: (data: Omit<EventData, 'id' | 'seats' | 'createdAt'>) => Promise<EventData | null>
  fetchOrders: () => Promise<void>
  fetchOrder: (id: string) => Promise<OrderData | null>
  createOrder: (eventId: string, seats: { row: number; col: number }[]) => Promise<OrderData | null>
}

export const useStore = create<AppState>((set, get) => ({
  events: [],
  orders: [],
  loading: false,

  fetchEvents: async () => {
    set({ loading: true })
    try {
      const res = await fetch('/api/events')
      if (!res.ok) throw new Error('Failed to fetch events')
      const events: EventData[] = await res.json()
      set({ events })
    } catch {
      console.error('Failed to fetch events')
    } finally {
      set({ loading: false })
    }
  },

  fetchEvent: async (id) => {
    try {
      const res = await fetch(`/api/events/${id}`)
      if (!res.ok) return null
      return await res.json()
    } catch {
      return null
    }
  },

  createEvent: async (data) => {
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) return null
      const event: EventData = await res.json()
      set((state) => ({ events: [...state.events, event] }))
      return event
    } catch {
      return null
    }
  },

  fetchOrders: async () => {
    set({ loading: true })
    try {
      const res = await fetch('/api/orders')
      if (!res.ok) throw new Error('Failed to fetch orders')
      const orders: OrderData[] = await res.json()
      set({ orders })
    } catch {
      console.error('Failed to fetch orders')
    } finally {
      set({ loading: false })
    }
  },

  fetchOrder: async (id) => {
    try {
      const res = await fetch(`/api/orders/${id}`)
      if (!res.ok) return null
      return await res.json()
    } catch {
      return null
    }
  },

  createOrder: async (eventId, seats) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, seats }),
      })
      if (!res.ok) return null
      const order: OrderData = await res.json()
      const [eventsRes, ordersRes] = await Promise.all([
        fetch('/api/events'),
        fetch('/api/orders'),
      ])
      const events = eventsRes.ok ? await eventsRes.json() : get().events
      const orders = ordersRes.ok ? await ordersRes.json() : get().orders
      set({ events, orders })
      return order
    } catch {
      return null
    }
  },
}))
