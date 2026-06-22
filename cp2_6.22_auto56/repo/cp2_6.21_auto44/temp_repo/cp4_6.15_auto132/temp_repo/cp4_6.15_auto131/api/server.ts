import { createServer } from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import app from './app.js'
import { getChallengeManager, getLeaderboard, submitRecord, sendFriendRequest } from './challengeManager.js'

const PORT = process.env.PORT || 3001

const server = createServer(app)

const wss = new WebSocketServer({ server, path: '/api/ws' })

const connectedClients = new Set<WebSocket>()

function broadcastToAll(data: unknown): void {
  const message = JSON.stringify(data)
  for (const client of connectedClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message)
    }
  }
}

const manager = getChallengeManager()
manager.setBroadcastCallback((data: unknown) => {
  broadcastToAll(data)
})

wss.on('connection', (ws: WebSocket) => {
  connectedClients.add(ws)

  ws.send(JSON.stringify({ type: 'leaderboard_update', data: getLeaderboard() }))

  ws.on('message', (raw: Buffer) => {
    try {
      const msg = JSON.parse(raw.toString())

      switch (msg.type) {
        case 'subscribe_leaderboard':
          ws.send(JSON.stringify({ type: 'leaderboard_update', data: getLeaderboard() }))
          break
        case 'submit_record': {
          if (msg.userId && msg.activities) {
            const result = submitRecord(msg.userId, msg.activities)
            ws.send(JSON.stringify({ type: 'record_submitted', data: result }))
          }
          break
        }
        case 'friend_request': {
          if (msg.from && msg.to) {
            const result = sendFriendRequest(msg.from, msg.to)
            ws.send(JSON.stringify({ type: 'friend_request_result', data: { success: result } }))
          }
          break
        }
      }
    } catch {
      // ignore invalid messages
    }
  })

  ws.on('close', () => {
    connectedClients.delete(ws)
  })
})

const broadcastInterval = setInterval(() => {
  broadcastToAll({ type: 'leaderboard_update', data: getLeaderboard() })
}, 5000)

server.listen(PORT, () => {
  console.log(`Server ready on port ${PORT}`)
})

function shutdown(): void {
  console.log('Shutdown signal received')
  clearInterval(broadcastInterval)
  wss.close()
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

export default app
