import { WebSocketServer, WebSocket } from 'ws'
import type { Server } from 'http'

interface Notification {
  id: string
  type: 'loan_request' | 'loan_approved' | 'loan_returned' | 'system'
  userId: string
  message: string
  data?: Record<string, unknown>
  timestamp: string
}

interface ConnectedClient {
  ws: WebSocket
  userId: string | null
}

class WebSocketManager {
  private wss: WebSocketServer | null = null
  private clients: Map<string, ConnectedClient> = new Map()

  init(server: Server): void {
    this.wss = new WebSocketServer({ server, path: '/ws' })

    this.wss.on('connection', (ws: WebSocket) => {
      const clientId = this.generateClientId()
      this.clients.set(clientId, { ws, userId: null })

      console.log(`WebSocket client connected: ${clientId}`)

      ws.on('message', (data: string) => {
        try {
          const message = JSON.parse(data.toString())
          this.handleMessage(clientId, message)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      })

      ws.on('close', () => {
        console.log(`WebSocket client disconnected: ${clientId}`)
        this.clients.delete(clientId)
      })

      ws.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error)
      })

      ws.send(
        JSON.stringify({
          type: 'connected',
          message: 'WebSocket connection established',
          clientId,
        }),
      )
    })

    console.log('WebSocket server initialized')
  }

  private handleMessage(clientId: string, message: Record<string, unknown>): void {
    const client = this.clients.get(clientId)
    if (!client) return

    if (message.type === 'auth' && typeof message.userId === 'string') {
      client.userId = message.userId
      console.log(`Client ${clientId} authenticated as user ${message.userId}`)

      client.ws.send(
        JSON.stringify({
          type: 'authenticated',
          userId: message.userId,
        }),
      )
    }
  }

  private generateClientId(): string {
    return `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  sendNotification(userId: string, notification: Omit<Notification, 'id' | 'timestamp'>): void {
    const fullNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    }

    const message = JSON.stringify({
      type: 'notification',
      notification: fullNotification,
    })

    let sentCount = 0
    for (const [, client] of this.clients) {
      if (client.userId === userId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message)
        sentCount++
      }
    }

    console.log(
      `Notification sent to ${sentCount} client(s) for user ${userId}: ${notification.message}`,
    )
  }

  broadcast(message: Record<string, unknown>): void {
    const data = JSON.stringify(message)
    for (const [, client] of this.clients) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(data)
      }
    }
  }

  getConnectedUserCount(userId: string): number {
    let count = 0
    for (const [, client] of this.clients) {
      if (client.userId === userId && client.ws.readyState === WebSocket.OPEN) {
        count++
      }
    }
    return count
  }

  close(): void {
    if (this.wss) {
      this.wss.close()
      this.wss = null
    }
    this.clients.clear()
  }
}

export const wsManager = new WebSocketManager()
