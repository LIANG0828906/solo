import express from 'express'
import cors from 'cors'
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 3001

const defaultData = { works: [], bookings: [] }
const file = path.join(__dirname, '..', 'db.json')
const adapter = new JSONFile(file)
const db = new Low(adapter, defaultData)

app.use(cors())
app.use(express.json())

const initialWorks = [
  { id: '1', title: '城市人像', thumbnailUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop', fullUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=1200&h=1800&fit=crop', category: 'portrait', price: 899, description: '都市街头的人像摄影，捕捉城市与人物的完美融合' },
  { id: '2', title: '自然光人像', thumbnailUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=600&fit=crop', fullUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=1200&h=1800&fit=crop', category: 'portrait', price: 799, description: '利用自然光线拍摄的柔和人像作品' },
  { id: '3', title: '艺术人像', thumbnailUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop', fullUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=1800&fit=crop', category: 'portrait', price: 1099, description: '创意构图与光影结合的艺术人像摄影' },
  { id: '4', title: '山川湖海', thumbnailUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop', fullUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=1800&fit=crop', category: 'landscape', price: 1299, description: '壮丽的自然风光，记录大自然的壮美瞬间' },
  { id: '5', title: '日落海岸', thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=600&fit=crop', fullUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=1800&fit=crop', category: 'landscape', price: 1199, description: '海边日落的绝美景色，温暖的金色光芒' },
  { id: '6', title: '森林秘境', thumbnailUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=600&fit=crop', fullUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&h=1800&fit=crop', category: 'landscape', price: 1099, description: '神秘的森林深处，阳光穿透树叶的梦幻光影' },
  { id: '7', title: '产品摄影', thumbnailUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=600&fit=crop', fullUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=1800&fit=crop', category: 'commercial', price: 1599, description: '专业产品摄影，展示商品的最佳质感' },
  { id: '8', title: '企业形象', thumbnailUrl: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=400&h=600&fit=crop', fullUrl: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&h=1800&fit=crop', category: 'commercial', price: 1899, description: '企业团队形象照，展现专业精神' },
  { id: '9', title: '美食摄影', thumbnailUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=600&fit=crop', fullUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&h=1800&fit=crop', category: 'commercial', price: 1299, description: '精致美食摄影，唤醒味蕾的视觉享受' },
  { id: '10', title: '婚礼纪实', thumbnailUrl: 'https://images.unsplash.com/photo-1540317580384-e5d43867caa6?w=400&h=600&fit=crop', fullUrl: 'https://images.unsplash.com/photo-1540317580384-e5d43867caa6?w=1200&h=1800&fit=crop', category: 'event', price: 3999, description: '婚礼当天的每一个珍贵瞬间，永久珍藏' },
  { id: '11', title: '生日派对', thumbnailUrl: 'https://images.unsplash.com/photo-1513407030348-c983a97b98d8?w=400&h=600&fit=crop', fullUrl: 'https://images.unsplash.com/photo-1513407030348-c983a97b98d8?w=1200&h=1800&fit=crop', category: 'event', price: 1599, description: '生日派对的欢乐时刻，记录美好回忆' },
  { id: '12', title: '企业年会', thumbnailUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=600&fit=crop', fullUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=1800&fit=crop', category: 'event', price: 2599, description: '企业年会活动摄影，记录团队精彩时刻' }
]

async function initDB() {
  await db.read()
  if (!db.data.works || db.data.works.length === 0) {
    db.data.works = initialWorks
    db.data.bookings = []
    await db.write()
  }
}

app.get('/api/works', async (req, res) => {
  await db.read()
  const { category } = req.query
  let works = db.data.works
  if (category) {
    works = works.filter(work => work.category === category)
  }
  res.json(works)
})

app.get('/api/works/:id', async (req, res) => {
  await db.read()
  const { id } = req.params
  const work = db.data.works.find(w => w.id === id)
  if (!work) {
    return res.status(404).json({ error: '作品不存在' })
  }
  res.json(work)
})

app.get('/api/bookings', async (req, res) => {
  await db.read()
  res.json(db.data.bookings)
})

app.post('/api/bookings', async (req, res) => {
  await db.read()
  const { name, phone, email, workId, date, message } = req.body
  
  if (!name || !phone || !workId || !date) {
    return res.status(400).json({ error: '缺少必要字段' })
  }

  const newBooking = {
    id: uuidv4(),
    name,
    phone,
    email: email || '',
    workId,
    date,
    message: message || '',
    status: 'pending',
    createdAt: new Date().toISOString()
  }

  db.data.bookings.push(newBooking)
  await db.write()
  res.status(201).json(newBooking)
})

app.patch('/api/bookings/:id/status', async (req, res) => {
  await db.read()
  const { id } = req.params
  const { status } = req.body

  if (!status || !['contacted', 'confirmed'].includes(status)) {
    return res.status(400).json({ error: '无效的状态值' })
  }

  const bookingIndex = db.data.bookings.findIndex(b => b.id === id)
  if (bookingIndex === -1) {
    return res.status(404).json({ error: '预约不存在' })
  }

  db.data.bookings[bookingIndex].status = status
  await db.write()
  res.json(db.data.bookings[bookingIndex])
})

async function startServer() {
  await initDB()
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
  })
}

startServer()
