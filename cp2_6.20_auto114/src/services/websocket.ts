import type { WSMessage } from '@/store'

type MessageHandler = (msg: WSMessage) => void

class WebSocketService {
  private ws: WebSocket | null = null
  private handlers: MessageHandler[] = []
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private url = 'ws://localhost:8000/ws'
  private fallbackMode = false
  private connectAttempts = 0
  private maxAttempts = 3

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return

    if (this.fallbackMode) {
      console.log('[WS] Running in fallback mode (local simulation)')
      return
    }

    if (this.connectAttempts >= this.maxAttempts) {
      console.log('[WS] Max attempts reached, switching to fallback mode')
      this.enterFallbackMode()
      return
    }

    this.connectAttempts++

    try {
      this.ws = new WebSocket(this.url)

      this.ws.onopen = () => {
        console.log('[WS] Connected to backend')
        this.connectAttempts = 0
        this.fallbackMode = false
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
        console.log(`[WS] Disconnected (attempt ${this.connectAttempts}/${this.maxAttempts})`)
        if (this.connectAttempts >= this.maxAttempts) {
          this.enterFallbackMode()
        } else {
          this.reconnectTimer = setTimeout(() => this.connect(), 2000)
        }
      }

      this.ws.onerror = () => {
        console.warn('[WS] Connection error')
        this.ws?.close()
      }
    } catch {
      console.warn(`[WS] Connection failed, will retry (attempt ${this.connectAttempts}/${this.maxAttempts})`)
      if (this.connectAttempts >= this.maxAttempts) {
        this.enterFallbackMode()
      } else {
        this.reconnectTimer = setTimeout(() => this.connect(), 2000)
      }
    }
  }

  private enterFallbackMode() {
    this.fallbackMode = true
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.ws = null
    console.log('[WS] Fallback mode activated - using local simulation')
  }

  isFallbackMode() {
    return this.fallbackMode
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.ws?.close()
    this.ws = null
    this.fallbackMode = false
    this.connectAttempts = 0
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
    } else if (this.fallbackMode) {
      console.log('[WS] Fallback mode: send ignored', data)
    }
  }

  simulateNotification(appointmentId: string): WSMessage {
    const msg: WSMessage = {
      type: 'appointment_confirmed',
      payload: {
        appointmentId,
        message: this.fallbackMode
          ? '预约成功！（演示模式）美容师正在准备中...'
          : '预约成功！美容师正在准备中...',
      },
      timestamp: new Date().toISOString(),
    }
    this.handlers.forEach((h) => h(msg))
    return msg
  }

  simulateProgress(appointmentId: string, progress: number): WSMessage {
    const getMessage = () => {
      if (progress >= 100) return '造型完成！您的爱宠焕然一新 🎉'
      if (progress >= 80) return '正在进行吹干整理...'
      if (progress >= 60) return '正在进行造型修剪...'
      if (progress >= 40) return '正在进行洗护...'
      if (progress >= 20) return '准备工作已完成，开始洗护...'
      return '美容师正在准备中...'
    }
    const msg: WSMessage = {
      type: progress >= 100 ? 'style_complete' : 'progress_update',
      payload: {
        appointmentId,
        progress,
        message: getMessage(),
      },
      timestamp: new Date().toISOString(),
    }
    this.handlers.forEach((h) => h(msg))
    return msg
  }
}

export const wsService = new WebSocketService()
