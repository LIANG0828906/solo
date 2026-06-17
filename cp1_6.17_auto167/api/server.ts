import { createServer } from 'http'
import app from './app.js'
import { WebSocketServer, type WebSocket } from 'ws'

const PORT = 3001

const server = createServer(app)

const wss = new WebSocketServer({ server })

const clients = new Set<WebSocket>()

wss.on('connection', (ws: WebSocket) => {
  clients.add(ws)
  ws.on('close', () => {
    clients.delete(ws)
  })
})

function broadcast(data: unknown): void {
  const payload = JSON.stringify(data)
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload)
    }
  }
}

;(app as any).broadcast = broadcast

server.listen(PORT, () => {
  console.log(`Server ready on port ${PORT}`)
})

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received')
  wss.close(() => {
    server.close(() => {
      console.log('Server closed')
      process.exit(0)
    })
  })
})

process.on('SIGINT', () => {
  console.log('SIGINT signal received')
  wss.close(() => {
    server.close(() => {
      console.log('Server closed')
      process.exit(0)
    })
  })
})

export { broadcast }
export default server
