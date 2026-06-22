import { io, type Socket } from 'socket.io-client'
import type { Booking, Device, AppNotification } from '@/types'

type Listener<T> = (data: T) => void

interface EventMap {
  'booking:created': Booking
  'booking:deleted': { id: string; reason?: string }
  'device:updated': Device
  notification: AppNotification
}

class WebSocketService {
  private socket: Socket | null = null
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map()

  connect() {
    if (this.socket) return
    this.socket = io({ transports: ['websocket', 'polling'] })

    this.socket.on('connect', () => {
      console.log('[WS] connected')
    })

    this.socket.on('disconnect', () => {
      console.log('[WS] disconnected')
    })

    for (const [event, set] of this.listeners.entries()) {
      this.socket.on(event, (data) => {
        set.forEach((fn) => fn(data))
      })
    }
  }

  on<K extends keyof EventMap>(event: K, fn: Listener<EventMap[K]>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
      if (this.socket) {
        this.socket.on(event, (data) => {
          this.listeners.get(event)?.forEach((l) => l(data))
        })
      }
    }
    const set = this.listeners.get(event)!
    set.add(fn as (data: unknown) => void)
    return () => set.delete(fn as (data: unknown) => void)
  }

  disconnect() {
    this.socket?.disconnect()
    this.socket = null
  }
}

export const wsService = new WebSocketService()
