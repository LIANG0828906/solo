export interface MeetingRoom {
  id: string
  name: string
  capacity: number
  location: string
  color: string
}

export type DeviceType = 'projector' | 'whiteboard' | 'video_conference'
export type DeviceStatus = 'idle' | 'occupied' | 'maintenance'

export interface Device {
  id: string
  name: string
  type: DeviceType
  roomId: string | null
  status: DeviceStatus
}

export interface Booking {
  id: string
  title: string
  roomId: string
  startTime: string
  endTime: string
  participants: number
  deviceIds: string[]
  notes: string
  createdBy: string
  attendees: string[]
}

export type NotificationType = 'success' | 'error' | 'info' | 'warning'

export interface AppNotification {
  id: string
  type: NotificationType
  message: string
  bookingId?: string
  timestamp: number
}

export interface BookingCreateInput {
  title: string
  roomId: string
  startTime: string
  endTime: string
  participants: number
  deviceIds: string[]
  notes: string
  attendees: string[]
}

export interface ToastMessage {
  id: string
  type: NotificationType
  message: string
  bookingId?: string
}
