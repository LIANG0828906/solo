import type { WSMessage } from '@/store'

type MessageHandler = (msg: WSMessage) => void

class WebSocketService {
  private ws: WebSocket | null = null
  private handlers: MessageHandler[] = []
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private url = 'ws://localhost:8000/ws'

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return

    try {
      this.ws = new WebSocket(this.url)

      this.ws.onopen = () => {
        console.log('[WS] Connected')
      }

      this.ws.onmessage = (event) => {
        try {
          const msg: WSMessage = JSON.parse(event.data)
          this.handlers.forEach((h) => h(msg))
        } catch {
          console.warn('[WS] Failed to parse message')
        }
      }

      this.ws.onclose = () => {
        console.log('[WS] Disconnected, reconnecting...')
        this.reconnectTimer = setTimeout(() => this.connect(), 3000)
      }

      this.ws.onerror = () => {
        this.ws?.close()
      }
    } catch {
      console.warn('[WS] Connection failed, will retry')
      this.reconnectTimer = setTimeout(() => this.connect(), 3000)
    }
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.ws?.close()
    this.ws = null
  }

  onMessage(handler: MessageHandler) {
    this.handlers.push(handler)
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler)
    }
  }

  send(data: unknown) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }

  simulateNotification(appointmentId: string): WSMessage {
    const msg: WSMessage = {
      type: 'appointment_confirmed',
      payload: {
        appointmentId,
        message: '预约成功！美容师正在准备中...',
      },
      timestamp: new Date().toISOString(),
    }
    this.handlers.forEach((h) => h(msg))
    return msg
  }

  simulateProgress(appointmentId: string, progress: number): WSMessage {
    const msg: WSMessage = {
      type: 'progress_update',
      payload: {
        appointmentId,
        progress,
        message: `造型进度：${progress}%`,
      },
      timestamp: new Date().toISOString(),
    }
    this.handlers.forEach((h) => h(msg))
    return msg
  }
}

export const wsService = new WebSocketService()
