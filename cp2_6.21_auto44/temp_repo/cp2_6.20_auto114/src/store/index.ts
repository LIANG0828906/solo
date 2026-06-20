import { create } from 'zustand'

export interface GroomingStyle {
  id: string
  name: string
  breed: string
  styleTag: string
  imageUrl: string
  groomerRating: number
  hairLength: number
  trimShape: string
  color: string
}

export interface Groomer {
  id: string
  name: string
  avatar: string
  specialties: string[]
  availableSlots: string[]
  portfolio: string[]
  rating: number
}

export interface ServiceItem {
  id: string
  name: string
  price: number
  duration: number
  icon: string
}

export interface Appointment {
  id: string
  date: string
  groomerId: string
  serviceIds: string[]
  styleId: string
  status: 'confirmed' | 'in_progress' | 'completed'
  progress: number
}

export interface WSMessage {
  type: 'appointment_confirmed' | 'progress_update' | 'style_complete'
  payload: {
    appointmentId: string
    progress?: number
    message?: string
  }
  timestamp: string
}

interface AppState {
  user: { id: string; name: string; email: string } | null
  selectedStyle: GroomingStyle | null
  appointment: Appointment | null
  notifications: WSMessage[]
  showPreview: boolean
  setSelectedStyle: (style: GroomingStyle | null) => void
  setAppointment: (appointment: Appointment | null) => void
  addNotification: (msg: WSMessage) => void
  removeNotification: (timestamp: string) => void
  clearNotifications: () => void
  setUser: (user: { id: string; name: string; email: string } | null) => void
  setShowPreview: (show: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  selectedStyle: null,
  appointment: null,
  notifications: [],
  showPreview: false,
  setSelectedStyle: (style) => set({ selectedStyle: style }),
  setAppointment: (appointment) => set({ appointment }),
  addNotification: (msg) =>
    set((state) => ({ notifications: [...state.notifications, msg] })),
  removeNotification: (timestamp) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.timestamp !== timestamp),
    })),
  clearNotifications: () => set({ notifications: [] }),
  setUser: (user) => set({ user }),
  setShowPreview: (show) => set({ showPreview: show }),
}))
