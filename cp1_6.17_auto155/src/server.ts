import express from 'express'
import cors from 'cors'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

interface Riddle {
  id: number
  riddle: string
  answer: string
  hint: string
}

interface LeaderboardEntry {
  id: number
  nickname: string
  litCount: number
  timeUsed: number
  createdAt: string
}

const riddles: Riddle[] = [
  {
    id: 1,
    riddle: '红口袋，绿口袋，有人怕，有人爱。',
    answer: '辣椒',
    hint: '一种蔬菜',
  },
  {
    id: 2,
    riddle: '一口吃掉牛尾巴。',
    answer: '告',
    hint: '一个汉字',
  },
  {
    id: 3,
    riddle: '远看像座山，近看不是山，上边水直流，下边石头乱。',
    answer: '雨',
    hint: '一种自然现象',
  },
  {
    id: 4,
    riddle: '有面没有口，有脚没有手，虽有四只脚，自己不会走。',
    answer: '桌子',
    hint: '一种家具',
  },
  {
    id: 5,
    riddle: '身穿绿衣裳，肚里水汪汪，生的子儿多，个个黑脸膛。',
    answer: '西瓜',
    hint: '一种水果',
  },
  {
    id: 6,
    riddle: '小时四只脚，大时两只脚，老时三只脚。',
    answer: '人',
    hint: '一种生物',
  },
]

let leaderboard: LeaderboardEntry[] = []
let nextId = 1

app.get('/api/lanterns', (_req, res) => {
  res.json(riddles)
})

app.post('/api/answer', (req, res) => {
  const { lanternId, answer } = req.body
  const riddle = riddles.find((r) => r.id === lanternId)
  if (!riddle) {
    return res.json({ correct: false })
  }
  const isCorrect = riddle.answer === answer.trim()
  res.json({ correct: isCorrect })
})

app.get('/api/leaderboard', (_req, res) => {
  const sorted = [...leaderboard].sort((a, b) => {
    if (b.litCount !== a.litCount) {
      return b.litCount - a.litCount
    }
    return a.timeUsed - b.timeUsed
  })
  res.json(sorted.slice(0, 10))
})

app.post('/api/leaderboard', (req, res) => {
  const { nickname, litCount, timeUsed } = req.body
  const entry: LeaderboardEntry = {
    id: nextId++,
    nickname,
    litCount,
    timeUsed,
    createdAt: new Date().toISOString(),
  }
  leaderboard.push(entry)
  res.json({ success: true, entry })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
