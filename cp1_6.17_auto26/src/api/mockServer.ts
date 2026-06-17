import express from 'express'
import cors from 'cors'
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface Gift {
  id: string
  name: string
  iconUrl: string
  price: number
  sales: number
}

interface Danmaku {
  id: string
  nickname: string
  avatar: string
  content: string
  timestamp: number
}

interface GiftRecord {
  id: string
  nickname: string
  avatar: string
  giftId: string
  giftName: string
  giftIcon: string
  count: number
  timestamp: number
}

interface User {
  id: string
  nickname: string
  avatar: string
  totalCoins: number
  todayCoins: number
  weekCoins: number
}

interface Data {
  gifts: Gift[]
  danmakus: Danmaku[]
  giftRecords: GiftRecord[]
  users: User[]
}

const defaultData: Data = {
  gifts: [
    {
      id: uuidv4(),
      name: '小心心',
      iconUrl: 'https://api.dicebear.com/7.x/icons/svg?seed=heart',
      price: 1,
      sales: 128,
    },
    {
      id: uuidv4(),
      name: '棒棒糖',
      iconUrl: 'https://api.dicebear.com/7.x/icons/svg?seed=candy',
      price: 5,
      sales: 86,
    },
    {
      id: uuidv4(),
      name: '鲜花',
      iconUrl: 'https://api.dicebear.com/7.x/icons/svg?seed=flower',
      price: 10,
      sales: 52,
    },
    {
      id: uuidv4(),
      name: '蛋糕',
      iconUrl: 'https://api.dicebear.com/7.x/icons/svg?seed=cake',
      price: 50,
      sales: 23,
    },
    {
      id: uuidv4(),
      name: '火箭',
      iconUrl: 'https://api.dicebear.com/7.x/icons/svg?seed=rocket',
      price: 100,
      sales: 12,
    },
    {
      id: uuidv4(),
      name: '皇冠',
      iconUrl: 'https://api.dicebear.com/7.x/icons/svg?seed=crown',
      price: 500,
      sales: 3,
    },
  ],
  danmakus: [],
  giftRecords: [],
  users: [
    {
      id: 'user-1',
      nickname: '土豪大哥',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rich',
      totalCoins: 9999,
      todayCoins: 2580,
      weekCoins: 6666,
    },
    {
      id: 'user-2',
      nickname: '神秘观众',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mystery',
      totalCoins: 5200,
      todayCoins: 1200,
      weekCoins: 3500,
    },
    {
      id: 'user-3',
      nickname: '快乐水',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=happy',
      totalCoins: 3680,
      todayCoins: 880,
      weekCoins: 2100,
    },
    {
      id: 'user-4',
      nickname: '小明同学',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaoming',
      totalCoins: 2100,
      todayCoins: 500,
      weekCoins: 1200,
    },
    {
      id: 'user-5',
      nickname: '路过的老王',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=laowang',
      totalCoins: 1580,
      todayCoins: 200,
      weekCoins: 800,
    },
    {
      id: 'user-6',
      nickname: '直播间常客',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=regular',
      totalCoins: 980,
      todayCoins: 100,
      weekCoins: 450,
    },
    {
      id: 'user-7',
      nickname: '新来的粉丝',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=newfan',
      totalCoins: 520,
      todayCoins: 50,
      weekCoins: 200,
    },
    {
      id: 'user-8',
      nickname: '默默围观',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=silent',
      totalCoins: 280,
      todayCoins: 30,
      weekCoins: 120,
    },
  ],
}

const dbFile = path.join(__dirname, '..', '..', 'data', 'db.json')
const adapter = new JSONFile<Data>(dbFile)
const db = new Low(adapter, defaultData)

await db.write()

const app = express()
app.use(cors())
app.use(express.json())

const success = (data: unknown) => ({
  code: 0,
  data,
  message: 'success',
})

const error = (message: string, code = -1) => ({
  code,
  data: null,
  message,
})

app.get('/api/gifts', async (req, res) => {
  await db.read()
  res.json(success(db.data.gifts))
})

app.post('/api/gifts', async (req, res) => {
  const { name, iconUrl, price } = req.body
  if (!name || !iconUrl || price === undefined) {
    return res.json(error('参数不完整'))
  }
  await db.read()
  const newGift: Gift = {
    id: uuidv4(),
    name,
    iconUrl,
    price,
    sales: 0,
  }
  db.data.gifts.push(newGift)
  await db.write()
  res.json(success(newGift))
})

app.put('/api/gifts/:id', async (req, res) => {
  const { id } = req.params
  const { name, iconUrl, price } = req.body
  await db.read()
  const giftIndex = db.data.gifts.findIndex((g) => g.id === id)
  if (giftIndex === -1) {
    return res.json(error('礼物不存在'))
  }
  const gift = db.data.gifts[giftIndex]
  if (name !== undefined) gift.name = name
  if (iconUrl !== undefined) gift.iconUrl = iconUrl
  if (price !== undefined) gift.price = price
  db.data.gifts[giftIndex] = gift
  await db.write()
  res.json(success(gift))
})

app.delete('/api/gifts/:id', async (req, res) => {
  const { id } = req.params
  await db.read()
  const giftIndex = db.data.gifts.findIndex((g) => g.id === id)
  if (giftIndex === -1) {
    return res.json(error('礼物不存在'))
  }
  db.data.gifts.splice(giftIndex, 1)
  await db.write()
  res.json(success(true))
})

app.get('/api/danmakus', async (req, res) => {
  await db.read()
  res.json(success(db.data.danmakus.slice(-50)))
})

app.get('/api/gift-records', async (req, res) => {
  await db.read()
  const records = [...db.data.giftRecords]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 50)
  res.json(success(records))
})

app.get('/api/ranking', async (req, res) => {
  const type = (req.query.type as string) || 'today'
  await db.read()

  const sortedUsers = [...db.data.users].sort((a, b) => {
    if (type === 'today') return b.todayCoins - a.todayCoins
    if (type === 'week') return b.weekCoins - a.weekCoins
    return b.totalCoins - a.totalCoins
  })

  const ranking = sortedUsers.map((user, index) => {
    const coins =
      type === 'today'
        ? user.todayCoins
        : type === 'week'
          ? user.weekCoins
          : user.totalCoins
    return {
      rank: index + 1,
      userId: user.id,
      nickname: user.nickname,
      avatar: user.avatar,
      coins,
    }
  })

  res.json(success(ranking))
})

app.post('/api/simulate/danmaku', async (req, res) => {
  const { nickname, avatar, content } = req.body
  if (!nickname || !content) {
    return res.json(error('参数不完整'))
  }
  await db.read()
  const newDanmaku: Danmaku = {
    id: uuidv4(),
    nickname,
    avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(nickname)}`,
    content,
    timestamp: Date.now(),
  }
  db.data.danmakus.push(newDanmaku)
  if (db.data.danmakus.length > 200) {
    db.data.danmakus = db.data.danmakus.slice(-200)
  }
  await db.write()
  res.json(success(newDanmaku))
})

app.post('/api/simulate/gift', async (req, res) => {
  const { nickname, avatar, giftId, count } = req.body
  if (!nickname || !giftId || !count) {
    return res.json(error('参数不完整'))
  }
  await db.read()

  const gift = db.data.gifts.find((g) => g.id === giftId)
  if (!gift) {
    return res.json(error('礼物不存在'))
  }

  gift.sales += count

  const userAvatar =
    avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(nickname)}`

  const newRecord: GiftRecord = {
    id: uuidv4(),
    nickname,
    avatar: userAvatar,
    giftId,
    giftName: gift.name,
    giftIcon: gift.iconUrl,
    count,
    timestamp: Date.now(),
  }
  db.data.giftRecords.unshift(newRecord)
  if (db.data.giftRecords.length > 200) {
    db.data.giftRecords = db.data.giftRecords.slice(0, 200)
  }

  const totalCoins = gift.price * count
  let user = db.data.users.find((u) => u.nickname === nickname)
  if (!user) {
    user = {
      id: uuidv4(),
      nickname,
      avatar: userAvatar,
      totalCoins: 0,
      todayCoins: 0,
      weekCoins: 0,
    }
    db.data.users.push(user)
  }
  user.totalCoins += totalCoins
  user.todayCoins += totalCoins
  user.weekCoins += totalCoins

  await db.write()
  res.json(success(newRecord))
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`Mock server running on http://localhost:${PORT}`)
})
