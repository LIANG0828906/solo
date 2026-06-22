import { create } from 'zustand'
import type { MeetingRoom, Device, Booking, AppNotification, ToastMessage } from '@/types'

interface AppState {
  rooms: MeetingRoom[]
  devices: Device[]
  bookings: Booking[]
  notifications: AppNotification[]
  toasts: ToastMessage[]

  setRooms: (rooms: MeetingRoom[]) => void
  setDevices: (devices: Device[]) => void
  setBookings: (bookings: Booking[]) => void

  addBooking: (booking: Booking) => void
  removeBooking: (id: string) => void
  updateDevice: (device: Device) => void

  addNotification: (n: AppNotification) => void
  removeNotification: (id: string) => void

  addToast: (t: ToastMessage) => void
  removeToast: (id: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  rooms: [],
  devices: [],
  bookings: [],
  notifications: [],
  toasts: [],

  setRooms: (rooms) => set({ rooms }),
  setDevices: (devices) => set({ devices }),
  setBookings: (bookings) => set({ bookings }),

  addBooking: (booking) =>
    set((s) => ({ bookings: [booking, ...s.bookings] })),
  removeBooking: (id) =>
    set((s) => ({ bookings: s.bookings.filter((b) => b.id !== id) })),
  updateDevice: (device) =>
    set((s) => ({
      devices: s.devices.map((d) => (d.id === device.id ? device : d)),
    })),

  addNotification: (n) =>
    set((s) => ({
      notifications: [n, ...s.notifications].slice(0, 20),
    })),
  removeNotification: (id) =>
    set((s) => ({
      notifications: s.notifications.filter((n) => n.id !== id),
    })),

  addToast: (t) => set((s) => ({ toasts: [...s.toasts, t] })),
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}))
