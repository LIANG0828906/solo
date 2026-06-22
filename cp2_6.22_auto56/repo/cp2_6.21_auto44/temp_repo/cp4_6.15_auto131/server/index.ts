import express, { type Request, type Response } from 'express'
import cors from 'cors'
import http from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import { v4 as uuidv4 } from 'uuid'
import {
  getLeaderboard,
  submitRecord,
  getUserProfile,
  sendFriendRequest,
  getChallengeManager,
} from './challengeManager.js'
import type { Activity, DailyRecord } from './challengeManager.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'ok' })
})

app.post('/api/records', (req: Request, res: Response) => {
  const { userId, activities } = req.body
  if (!userId || !activities) {
    res.status(400).json({ success: false, error: 'Missing userId or activities' })
    return
  }
  const result = submitRecord(userId, activities as Activity[])
  res.status(200).json({
    success: true,
    record: result.record,
    advice: result.advice,
    newBadges: result.newBadges,
  })
})

app.get('/api/records/:userId', (req: Request, res: Response) => {
  const userId = req.params.userId
  const user = getUserProfile(userId)
  if (!user) {
    res.status(404).json({ success: false, error: 'User not found' })
    return
  }
  res.status(200).json({ success: true, data: { user } })
})

app.get('/api/leaderboard', (_req: Request, res: Response) => {
  const leaderboard = getLeaderboard()
  res.status(200).json({ success: true, data: leaderboard })
})

app.post('/api/friends/request', (req: Request, res: Response) => {
  const { from, to } = req.body
  if (!from || !to) {
    res.status(400).json({ success: false, error: 'Missing from or to' })
    return
  }
  const success = sendFriendRequest(from, to)
  res.status(200).json({ success })
})

app.get('/api/users/:userId', (req: Request, res: Response) => {
  const profile = getUserProfile(req.params.userId)
  if (!profile) {
    res.status(404).json({ success: false, error: 'User not found' })
    return
  }
  res.status(200).json({ success: true, data: profile })
})

const server = http.createServer(app)

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
            const result = submitRecord(msg.userId, msg.activities as Activity[])
            ws.send(JSON.stringify({ type: 'record_submitted', data: result }))
            broadcastToAll({ type: 'rank_change', data: result.leaderboard })
          }
          break
        }
        case 'friend_request': {
          if (msg.from && msg.to) {
            const success = sendFriendRequest(msg.from, msg.to)
            ws.send(JSON.stringify({ type: 'friend_request_result', data: { success } }))
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
  console.log(`🚀 Carbon Footprint Lab server ready on port ${PORT}`)
  console.log(`   - HTTP API: http://localhost:${PORT}/api/health`)
  console.log(`   - WebSocket: ws://localhost:${PORT}/api/ws`)
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
