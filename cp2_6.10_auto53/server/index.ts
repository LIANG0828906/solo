import express from 'express'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'

interface Horse {
  id: string
  name: string
  status: 'idle' | 'in_use'
  matchTime: number | null
}

interface Log {
  id: string
  time: string
  type: string
  message: string
  level: 'info' | 'warn' | 'error'
}

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

const horseNames = ['赤兔', '的卢', '绝影', '爪黄飞电', '照夜玉狮子', '乌云踏雪', '汗血宝马', '乌骓', '飒露紫', '特勒骠']

let horses: Horse[] = horseNames.map(name => ({
  id: uuidv4(),
  name,
  status: 'idle',
  matchTime: null
}))

let logs: Log[] = []

app.get('/api/horses', (req, res) => {
  res.json(horses)
})

app.patch('/api/horses/:id', (req, res) => {
  const { id } = req.params
  const { status, matchTime } = req.body
  const horse = horses.find(h => h.id === id)
  
  if (!horse) {
    return res.status(404).json({ error: '马匹不存在' })
  }
  
  horse.status = status
  horse.matchTime = matchTime
  res.json(horse)
})

app.post('/api/logs', (req, res) => {
  const { type, message, level } = req.body
  const log: Log = {
    id: uuidv4(),
    time: new Date().toISOString(),
    type,
    message,
    level: level || 'info'
  }
  logs.unshift(log)
  res.json(log)
})

app.get('/api/logs', (req, res) => {
  res.json(logs)
})

app.listen(PORT, () => {
  console.log(`驿馆服务器运行在 http://localhost:${PORT}`)
})
