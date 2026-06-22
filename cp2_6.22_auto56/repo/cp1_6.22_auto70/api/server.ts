import { createServer } from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import app from './app.js'
import { addMessage } from './data/store.js'

const PORT = process.env.PORT || 3001

const server = createServer(app)

const wss = new WebSocketServer({ server })

const clients = new Set<WebSocket>()

wss.on('connection', (ws) => {
  clients.add(ws)

  ws.on('message', (raw) => {
    try {
      const data = JSON.parse(raw.toString())

      if (data.type === 'chat') {
        const { scheduleId, userId, content } = data

        if (!scheduleId || !userId || !content) return

        const msg = addMessage({
          scheduleId,
          userId,
          content,
          type: 'text',
        })

        const broadcast = JSON.stringify({
          ...msg,
          type: 'chat',
        })

        for (const client of clients) {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(broadcast)
          }
        }
      }
    } catch {
      // ignore invalid messages
    }
  })

  ws.on('close', () => {
    clients.delete(ws)
  })
})

server.listen(PORT, () => {
  console.log(`Server ready on port ${PORT}`)
  console.log(`WebSocket server ready on port ${PORT}`)
})

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('SIGINT signal received')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

export default server
