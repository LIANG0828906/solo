import express from 'express'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'
import { initStore, getAllRooms, getRoomById, joinRoom, leaveRoom, tickStudy, setFocusing, getLeaderboard, getOnlineCount } from './roomStore.js'

const app = express()
app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

app.get('/api/rooms', async (_req, res) => {
  try {
    const rooms = await getAllRooms()
    const result = await Promise.all(
      rooms.map(async room => ({
        id: room._id,
        name: room.name,
        onlineCount: room.users.length,
        createdAt: room.createdAt,
      }))
    )
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rooms' })
  }
})

app.post('/api/rooms/:id/join', async (req, res) => {
  try {
    const { id } = req.params
    const nickname = (req.query.nickname as string) || (req.body?.nickname) || '匿名用户'
    let userId = req.query.userId as string || req.body?.userId
    if (!userId) {
      userId = uuidv4()
    }
    const user = await joinRoom(id, userId, nickname)
    if (!user) {
      res.status(404).json({ error: 'Room not found' })
      return
    }
    res.json({ userId, ...user })
  } catch (err) {
    res.status(500).json({ error: 'Failed to join room' })
  }
})

app.post('/api/rooms/:id/leave', async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.query.userId as string || req.body?.userId
    if (!userId) {
      res.status(400).json({ error: 'userId required' })
      return
    }
    const ok = await leaveRoom(id, userId)
    if (!ok) {
      res.status(404).json({ error: 'Room not found' })
      return
    }
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to leave room' })
  }
})

app.post('/api/rooms/:id/tick', async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.query.userId as string || req.body?.userId
    if (!userId) {
      res.status(400).json({ error: 'userId required' })
      return
    }
    const total = await tickStudy(id, userId)
    res.json({ studySeconds: total })
  } catch (err) {
    res.status(500).json({ error: 'Failed to tick' })
  }
})

app.post('/api/rooms/:id/focus', async (req, res) => {
  try {
    const { id } = req.params
    const { userId, focusing } = req.body
    if (!userId) {
      res.status(400).json({ error: 'userId required' })
      return
    }
    await setFocusing(id, userId, !!focusing)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to set focus state' })
  }
})

app.get('/api/rooms/:id/leaderboard', async (req, res) => {
  try {
    const { id } = req.params
    const board = await getLeaderboard(id)
    res.json(board)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' })
  }
})

app.get('/api/rooms/:id/online', async (req, res) => {
  try {
    const { id } = req.params
    const count = await getOnlineCount(id)
    res.json({ onlineCount: count })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch online count' })
  }
})

const PORT = 4000

async function start() {
  await initStore()
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}

start()
