import express from 'express'
import cors from 'cors'
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface User {
  id: string
  username: string
  password: string
}

interface Artwork {
  id: string
  title: string
  author: string
  year: number
  width: number
  height: number
  imageUrl: string
}

interface PlacedArtwork {
  id: string
  artworkId: string
  wall: 'front' | 'back' | 'left' | 'right'
  positionX: number
  positionY: number
  rotation: number
  scale: number
}

interface Exhibition {
  id: string
  userId: string
  name: string
  artworks: PlacedArtwork[]
  createdAt: string
}

interface Database {
  users: User[]
  artworks: Artwork[]
  exhibitions: Exhibition[]
}

const app = express()
const port = 3001

app.use(cors())
app.use(express.json())

const dbFile = path.join(__dirname, 'db.json')
const adapter = new JSONFile<Database>(dbFile)
const defaultData: Database = {
  users: [
    { id: '1', username: 'demo', password: 'demo123' }
  ],
  artworks: [
    {
      id: 'art1',
      title: '星夜',
      author: '文森特·梵高',
      year: 1889,
      width: 737,
      height: 921,
      imageUrl: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=500&fit=crop'
    },
    {
      id: 'art2',
      title: '蒙娜丽莎',
      author: '列奥纳多·达·芬奇',
      year: 1503,
      width: 534,
      height: 792,
      imageUrl: 'https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=400&h=600&fit=crop'
    },
    {
      id: 'art3',
      title: '呐喊',
      author: '爱德华·蒙克',
      year: 1893,
      width: 660,
      height: 835,
      imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&h=500&fit=crop'
    },
    {
      id: 'art4',
      title: '记忆的永恒',
      author: '萨尔瓦多·达利',
      year: 1931,
      width: 945,
      height: 710,
      imageUrl: 'https://images.unsplash.com/photo-1549490349-8643362247b5?w=500&h=400&fit=crop'
    },
    {
      id: 'art5',
      title: '戴珍珠耳环的少女',
      author: '约翰内斯·维米尔',
      year: 1665,
      width: 445,
      height: 560,
      imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=500&fit=crop'
    },
    {
      id: 'art6',
      title: '日出印象',
      author: '克劳德·莫奈',
      year: 1872,
      width: 1052,
      height: 746,
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=350&fit=crop'
    },
    {
      id: 'art7',
      title: '睡莲',
      author: '克劳德·莫奈',
      year: 1906,
      width: 899,
      height: 902,
      imageUrl: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=450&h=450&fit=crop'
    },
    {
      id: 'art8',
      title: '向日葵',
      author: '文森特·梵高',
      year: 1888,
      width: 765,
      height: 950,
      imageUrl: 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=400&h=500&fit=crop'
    },
    {
      id: 'art9',
      title: '格尔尼卡',
      author: '巴勃罗·毕加索',
      year: 1937,
      width: 1500,
      height: 650,
      imageUrl: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=600&h=300&fit=crop'
    },
    {
      id: 'art10',
      title: '最后的晚餐',
      author: '列奥纳多·达·芬奇',
      year: 1498,
      width: 1200,
      height: 550,
      imageUrl: 'https://images.unsplash.com/photo-1509248961725-aec71c04ae94?w=600&h=280&fit=crop'
    },
    {
      id: 'art11',
      title: '维纳斯的诞生',
      author: '桑德罗·波提切利',
      year: 1485,
      width: 680,
      height: 900,
      imageUrl: 'https://images.unsplash.com/photo-1582561428698-828f9e3fdc70?w=400&h=550&fit=crop'
    },
    {
      id: 'art12',
      title: '创世纪',
      author: '米开朗基罗',
      year: 1512,
      width: 1100,
      height: 600,
      imageUrl: 'https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=550&h=300&fit=crop'
    }
  ],
  exhibitions: []
}

const db = new Low(adapter, defaultData)
await db.read()
if (!db.data) {
  db.data = defaultData
  await db.write()
}

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body
  const user = db.data!.users.find(
    (u) => u.username === username && u.password === password
  )
  if (user) {
    res.json({ success: true, userId: user.id, username: user.username })
  } else {
    res.status(401).json({ success: false, message: '用户名或密码错误' })
  }
})

app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body
  const existing = db.data!.users.find((u) => u.username === username)
  if (existing) {
    res.status(400).json({ success: false, message: '用户名已存在' })
    return
  }
  const newUser: User = {
    id: uuidv4(),
    username,
    password
  }
  db.data!.users.push(newUser)
  await db.write()
  res.json({ success: true, userId: newUser.id, username: newUser.username })
})

app.get('/api/artworks', (_req, res) => {
  res.json(db.data!.artworks)
})

app.get('/api/exhibitions/:userId', (req, res) => {
  const { userId } = req.params
  const exhibitions = db.data!.exhibitions.filter((e) => e.userId === userId)
  res.json(exhibitions)
})

app.post('/api/exhibitions', async (req, res) => {
  const { userId, name, artworks } = req.body
  const newExhibition: Exhibition = {
    id: uuidv4(),
    userId,
    name: name || '我的展览',
    artworks: artworks || [],
    createdAt: new Date().toISOString()
  }
  db.data!.exhibitions.push(newExhibition)
  await db.write()
  res.json(newExhibition)
})

app.put('/api/exhibitions/:id', async (req, res) => {
  const { id } = req.params
  const { name, artworks } = req.body
  const exhibition = db.data!.exhibitions.find((e) => e.id === id)
  if (!exhibition) {
    res.status(404).json({ message: '展览不存在' })
    return
  }
  if (name !== undefined) exhibition.name = name
  if (artworks !== undefined) exhibition.artworks = artworks
  await db.write()
  res.json(exhibition)
})

app.get('/api/exhibition/share/:id', (req, res) => {
  const { id } = req.params
  const exhibition = db.data!.exhibitions.find((e) => e.id === id)
  if (!exhibition) {
    res.status(404).json({ message: '展览不存在' })
    return
  }
  res.json(exhibition)
})

app.delete('/api/exhibitions/:id', async (req, res) => {
  const { id } = req.params
  const index = db.data!.exhibitions.findIndex((e) => e.id === id)
  if (index === -1) {
    res.status(404).json({ message: '展览不存在' })
    return
  }
  db.data!.exhibitions.splice(index, 1)
  await db.write()
  res.json({ success: true })
})

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
