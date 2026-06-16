import { WebSocketServer, WebSocket } from 'ws'
import type { Server } from 'http'
import { checkinTicket } from './services/ticketService.js'

interface WSMessage {
  event: string
  data: unknown
}

class WebSocketManager {
  private clients: Set<WebSocket> = new Set()
  private wss: WebSocketServer | null = null

  attach(server: Server): void {
    this.wss = new WebSocketServer({ server, path: '/ws' })

    this.wss.on('connection', (ws) => {
      this.clients.add(ws)
      console.log(`WebSocket 客户端已连接，当前连接数: ${this.clients.size}`)

      ws.on('message', (raw) => {
        try {
          const msg: WSMessage = JSON.parse(raw.toString())
          if (msg.event === 'checkin') {
            this.handleCheckin(ws, msg.data as { ticketNo: string })
          }
        } catch {
          ws.send(JSON.stringify({ event: 'error', data: { message: '无效消息格式' } }))
        }
      })

      ws.on('close', () => {
        this.clients.delete(ws)
        console.log(`WebSocket 客户端已断开，当前连接数: ${this.clients.size}`)
      })
    })
  }

  broadcast(event: string, data: unknown): void {
    const msg = JSON.stringify({ event, data })
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg)
      }
    }
  }

  handleCheckin(ws: WebSocket, data: { ticketNo: string }): void {
    try {
      const ticket = checkinTicket(data.ticketNo)
      ws.send(JSON.stringify({ event: 'checkin_success', data: ticket }))
      this.broadcast('ticket_update', { eventId: ticket.eventId, ticketNo: ticket.ticketNo })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '核销失败'
      ws.send(JSON.stringify({ event: 'checkin_error', data: { message } }))
    }
  }
}

const wsManager = new WebSocketManager()
export default wsManager
