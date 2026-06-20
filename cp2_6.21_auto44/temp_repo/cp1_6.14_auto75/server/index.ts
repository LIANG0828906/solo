import express from 'express'
import cors from 'cors'
import multer from 'multer'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

const uploadsDir = path.join(__dirname, '../uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

interface DatabaseSchema {
  plants: Plant[]
  records: CareRecord[]
  photos: Photo[]
  healthReports: HealthReport[]
}

interface Plant {
  id: string
  name: string
  species: string
  purchaseDate: string
  location: string
  photo: string
  waterCycle: number
  fertilizeCycle: number
  lastWatered?: string
  lastFertilized?: string
  createdAt: string
}

interface CareRecord {
  id: string
  plantId: string
  type: 'water' | 'fertilize' | 'prune' | 'repot' | 'observation'
  note: string
  date: string
  time: string
}

interface Photo {
  id: string
  plantId: string
  url: string
  date: string
  month: string
}

interface HealthReport {
  id: string
  plantId: string
  score: number
  suggestions: string[]
  date: string
  answers: number[]
}

const defaultData: DatabaseSchema = {
  plants: [
    {
      id: uuidv4(),
      name: '小绿',
      species: '绿萝',
      purchaseDate: '2024-01-15',
      location: '客厅',
      photo: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=400&h=300&fit=crop',
      waterCycle: 3,
      fertilizeCycle: 15,
      lastWatered: '2026-06-12',
      lastFertilized: '2026-06-01',
      createdAt: '2024-01-15T00:00:00.000Z'
    },
    {
      id: uuidv4(),
      name: '肉肉',
      species: '多肉',
      purchaseDate: '2024-03-20',
      location: '阳台',
      photo: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400&h=300&fit=crop',
      waterCycle: 7,
      fertilizeCycle: 30,
      lastWatered: '2026-06-08',
      lastFertilized: '2026-05-20',
      createdAt: '2024-03-20T00:00:00.000Z'
    },
    {
      id: uuidv4(),
      name: '兰兰',
      species: '吊兰',
      purchaseDate: '2024-05-10',
      location: '书房',
      photo: 'https://images.unsplash.com/photo-1597055181300-e3633a91131a?w=400&h=300&fit=crop',
      waterCycle: 4,
      fertilizeCycle: 20,
      lastWatered: '2026-06-10',
      lastFertilized: '2026-05-25',
      createdAt: '2024-05-10T00:00:00.000Z'
    },
    {
      id: uuidv4(),
      name: '龟龟',
      species: '龟背竹',
      purchaseDate: '2024-08-01',
      location: '客厅',
      photo: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=400&h=300&fit=crop',
      waterCycle: 5,
      fertilizeCycle: 25,
      lastWatered: '2026-06-09',
      lastFertilized: '2026-05-15',
      createdAt: '2024-08-01T00:00:00.000Z'
    },
    {
      id: uuidv4(),
      name: '仙仙',
      species: '仙人掌',
      purchaseDate: '2024-10-15',
      location: '阳台',
      photo: 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=400&h=300&fit=crop',
      waterCycle: 14,
      fertilizeCycle: 60,
      lastWatered: '2026-06-01',
      lastFertilized: '2026-04-01',
      createdAt: '2024-10-15T00:00:00.000Z'
    }
  ],
  records: [],
  photos: [],
  healthReports: []
}

const samplePlantIds = defaultData.plants.map(p => p.id)

const sampleRecords: CareRecord[] = [
  { id: uuidv4(), plantId: samplePlantIds[0], type: 'water', note: '浇了200ml水，土壤湿润', date: '2026-06-12', time: '09:00' },
  { id: uuidv4(), plantId: samplePlantIds[0], type: 'observation', note: '叶片翠绿，长势良好，有新芽长出', date: '2026-06-10', time: '18:30' },
  { id: uuidv4(), plantId: samplePlantIds[0], type: 'fertilize', note: '施加了少量有机液肥', date: '2026-06-01', time: '10:00' },
  { id: uuidv4(), plantId: samplePlantIds[1], type: 'water', note: '少量浇水，避免烂根', date: '2026-06-08', time: '08:00' },
  { id: uuidv4(), plantId: samplePlantIds[1], type: 'observation', note: '颜色饱满，状态很好', date: '2026-06-05', time: '12:00' },
  { id: uuidv4(), plantId: samplePlantIds[2], type: 'water', note: '浇透水', date: '2026-06-10', time: '09:30' },
  { id: uuidv4(), plantId: samplePlantIds[2], type: 'prune', note: '修剪了枯黄的叶片', date: '2026-06-06', time: '17:00' },
  { id: uuidv4(), plantId: samplePlantIds[3], type: 'water', note: '浇透水，擦拭了叶片', date: '2026-06-09', time: '10:00' },
  { id: uuidv4(), plantId: samplePlantIds[3], type: 'observation', note: '有新叶展开，非常健康', date: '2026-06-08', time: '16:00' },
  { id: uuidv4(), plantId: samplePlantIds[4], type: 'water', note: '少量浇水', date: '2026-06-01', time: '11:00' }
]

defaultData.records = sampleRecords

const samplePhotos: Photo[] = [
  { id: uuidv4(), plantId: samplePlantIds[0], url: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=600&h=450&fit=crop', date: '2026-06-01', month: '2026-06' },
  { id: uuidv4(), plantId: samplePlantIds[0], url: 'https://images.unsplash.com/photo-1597055181300-e3633a91131a?w=600&h=450&fit=crop', date: '2026-05-15', month: '2026-05' },
  { id: uuidv4(), plantId: samplePlantIds[0], url: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600&h=450&fit=crop', date: '2026-04-10', month: '2026-04' },
  { id: uuidv4(), plantId: samplePlantIds[0], url: 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=600&h=450&fit=crop', date: '2026-03-20', month: '2026-03' },
  { id: uuidv4(), plantId: samplePlantIds[0], url: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=600&h=450&fit=crop', date: '2026-02-05', month: '2026-02' },
  { id: uuidv4(), plantId: samplePlantIds[1], url: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600&h=450&fit=crop', date: '2026-06-05', month: '2026-06' },
  { id: uuidv4(), plantId: samplePlantIds[1], url: 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=600&h=450&fit=crop', date: '2026-05-10', month: '2026-05' },
  { id: uuidv4(), plantId: samplePlantIds[1], url: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=600&h=450&fit=crop', date: '2026-04-15', month: '2026-04' },
  { id: uuidv4(), plantId: samplePlantIds[2], url: 'https://images.unsplash.com/photo-1597055181300-e3633a91131a?w=600&h=450&fit=crop', date: '2026-06-08', month: '2026-06' },
  { id: uuidv4(), plantId: samplePlantIds[2], url: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600&h=450&fit=crop', date: '2026-05-20', month: '2026-05' },
  { id: uuidv4(), plantId: samplePlantIds[3], url: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=600&h=450&fit=crop', date: '2026-06-10', month: '2026-06' },
  { id: uuidv4(), plantId: samplePlantIds[4], url: 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=600&h=450&fit=crop', date: '2026-06-01', month: '2026-06' }
]

defaultData.photos = samplePhotos

const dbFile = path.join(__dirname, '../db.json')
const adapter = new JSONFile<DatabaseSchema>(dbFile)
const db = new Low<DatabaseSchema>(adapter, defaultData)

await db.read()
if (!db.data) {
  db.data = defaultData
  await db.write()
}

const storage = multer.memoryStorage()
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
})

const processAndSaveImage = async (buffer: Buffer, filename: string) => {
  const processedBuffer = await sharp(buffer)
    .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer()
  
  const outputPath = path.join(uploadsDir, filename)
  await fs.promises.writeFile(outputPath, processedBuffer)
  return `/uploads/${filename}`
}

app.get('/api/plants', async (req, res) => {
  try {
    await db.read()
    res.json(db.data!.plants)
  } catch (error) {
    res.status(500).json({ error: '获取植物列表失败' })
  }
})

app.get('/api/plants/:id', async (req, res) => {
  try {
    await db.read()
    const plant = db.data!.plants.find(p => p.id === req.params.id)
    if (!plant) {
      return res.status(404).json({ error: '植物不存在' })
    }
    res.json(plant)
  } catch (error) {
    res.status(500).json({ error: '获取植物详情失败' })
  }
})

app.post('/api/plants', upload.single('photo'), async (req, res) => {
  try {
    let photoUrl = ''
    if (req.file) {
      const filename = `${uuidv4()}.jpg`
      photoUrl = await processAndSaveImage(req.file.buffer, filename)
    }

    const newPlant: Plant = {
      id: uuidv4(),
      name: req.body.name,
      species: req.body.species,
      purchaseDate: req.body.purchaseDate,
      location: req.body.location,
      photo: photoUrl || 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=400&h=300&fit=crop',
      waterCycle: parseInt(req.body.waterCycle) || 3,
      fertilizeCycle: parseInt(req.body.fertilizeCycle) || 15,
      createdAt: new Date().toISOString()
    }

    await db.read()
    db.data!.plants.push(newPlant)
    await db.write()
    res.status(201).json(newPlant)
  } catch (error) {
    console.error('添加植物失败:', error)
    res.status(500).json({ error: '添加植物失败' })
  }
})

app.put('/api/plants/:id', async (req, res) => {
  try {
    await db.read()
    const index = db.data!.plants.findIndex(p => p.id === req.params.id)
    if (index === -1) {
      return res.status(404).json({ error: '植物不存在' })
    }
    db.data!.plants[index] = { ...db.data!.plants[index], ...req.body }
    await db.write()
    res.json(db.data!.plants[index])
  } catch (error) {
    res.status(500).json({ error: '更新植物失败' })
  }
})

app.delete('/api/plants/:id', async (req, res) => {
  try {
    await db.read()
    db.data!.plants = db.data!.plants.filter(p => p.id !== req.params.id)
    db.data!.records = db.data!.records.filter(r => r.plantId !== req.params.id)
    db.data!.photos = db.data!.photos.filter(p => p.plantId !== req.params.id)
    db.data!.healthReports = db.data!.healthReports.filter(h => h.plantId !== req.params.id)
    await db.write()
    res.json({ message: '删除成功' })
  } catch (error) {
    res.status(500).json({ error: '删除植物失败' })
  }
})

app.get('/api/reminders', async (req, res) => {
  try {
    await db.read()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const reminders = []

    for (const plant of db.data!.plants) {
      if (plant.lastWatered) {
        const lastWatered = new Date(plant.lastWatered)
        lastWatered.setHours(0, 0, 0, 0)
        const nextWater = new Date(lastWatered)
        nextWater.setDate(nextWater.getDate() + plant.waterCycle)
        const daysLeft = Math.ceil((nextWater.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

        if (daysLeft <= 7) {
          reminders.push({
            id: `${plant.id}-water`,
            plantId: plant.id,
            plantName: plant.name,
            type: 'water',
            dueDate: nextWater.toISOString().split('T')[0],
            daysLeft,
            completed: false
          })
        }
      } else {
        reminders.push({
          id: `${plant.id}-water`,
          plantId: plant.id,
          plantName: plant.name,
          type: 'water',
          dueDate: today.toISOString().split('T')[0],
          daysLeft: 0,
          completed: false
        })
      }

      if (plant.lastFertilized) {
        const lastFertilized = new Date(plant.lastFertilized)
        lastFertilized.setHours(0, 0, 0, 0)
        const nextFertilize = new Date(lastFertilized)
        nextFertilize.setDate(nextFertilize.getDate() + plant.fertilizeCycle)
        const daysLeft = Math.ceil((nextFertilize.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

        if (daysLeft <= 7) {
          reminders.push({
            id: `${plant.id}-fertilize`,
            plantId: plant.id,
            plantName: plant.name,
            type: 'fertilize',
            dueDate: nextFertilize.toISOString().split('T')[0],
            daysLeft,
            completed: false
          })
        }
      }
    }

    reminders.sort((a, b) => a.daysLeft - b.daysLeft)
    res.json(reminders)
  } catch (error) {
    res.status(500).json({ error: '获取提醒失败' })
  }
})

app.post('/api/reminders/:id/complete', async (req, res) => {
  try {
    const [plantId, type] = req.params.id.split('-')
    await db.read()
    const plant = db.data!.plants.find(p => p.id === plantId)
    if (plant) {
      const today = new Date().toISOString().split('T')[0]
      if (type === 'water') {
        plant.lastWatered = today
      } else if (type === 'fertilize') {
        plant.lastFertilized = today
      }
      await db.write()
    }
    res.json({ message: '标记完成' })
  } catch (error) {
    res.status(500).json({ error: '操作失败' })
  }
})

app.get('/api/plants/:id/records', async (req, res) => {
  try {
    await db.read()
    const records = db.data!.records
      .filter(r => r.plantId === req.params.id)
      .sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date)
        if (dateCompare !== 0) return dateCompare
        return b.time.localeCompare(a.time)
      })
    res.json(records)
  } catch (error) {
    res.status(500).json({ error: '获取记录失败' })
  }
})

app.post('/api/plants/:id/records', async (req, res) => {
  try {
    const newRecord: CareRecord = {
      id: uuidv4(),
      plantId: req.params.id,
      type: req.body.type,
      note: req.body.note || '',
      date: req.body.date,
      time: req.body.time
    }

    await db.read()
    db.data!.records.push(newRecord)

    const plant = db.data!.plants.find(p => p.id === req.params.id)
    if (plant && req.body.type === 'water') {
      plant.lastWatered = req.body.date
    } else if (plant && req.body.type === 'fertilize') {
      plant.lastFertilized = req.body.date
    }

    await db.write()
    res.status(201).json(newRecord)
  } catch (error) {
    res.status(500).json({ error: '添加记录失败' })
  }
})

app.get('/api/plants/:id/photos', async (req, res) => {
  try {
    await db.read()
    const photos = db.data!.photos
      .filter(p => p.plantId === req.params.id)
      .sort((a, b) => b.date.localeCompare(a.date))
    res.json(photos)
  } catch (error) {
    res.status(500).json({ error: '获取照片失败' })
  }
})

app.post('/api/plants/:id/photos', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' })
    }

    const filename = `${uuidv4()}.jpg`
    const photoUrl = await processAndSaveImage(req.file.buffer, filename)
    const today = new Date().toISOString().split('T')[0]

    const newPhoto: Photo = {
      id: uuidv4(),
      plantId: req.params.id,
      url: photoUrl,
      date: today,
      month: today.substring(0, 7)
    }

    await db.read()
    db.data!.photos.push(newPhoto)
    await db.write()
    res.status(201).json(newPhoto)
  } catch (error) {
    res.status(500).json({ error: '上传照片失败' })
  }
})

app.post('/api/photos/download', async (req, res) => {
  try {
    const { photoIds } = req.body
    await db.read()
    const photos = db.data!.photos.filter(p => photoIds.includes(p.id))
    res.json(photos)
  } catch (error) {
    res.status(500).json({ error: '获取照片信息失败' })
  }
})

app.get('/api/plants/:id/health', async (req, res) => {
  try {
    await db.read()
    const reports = db.data!.healthReports
      .filter(h => h.plantId === req.params.id)
      .sort((a, b) => b.date.localeCompare(a.date))
    res.json(reports)
  } catch (error) {
    res.status(500).json({ error: '获取健康报告失败' })
  }
})

app.post('/api/plants/:id/health', async (req, res) => {
  try {
    const { answers } = req.body

    const HEALTH_QUESTIONS = [
      { options: [{ score: 25 }, { score: 18 }, { score: 10 }, { score: 3 }] },
      { options: [{ score: 25 }, { score: 18 }, { score: 10 }, { score: 3 }] },
      { options: [{ score: 25 }, { score: 18 }, { score: 10 }, { score: 3 }] },
      { options: [{ score: 25 }, { score: 18 }, { score: 10 }, { score: 3 }] }
    ]

    let totalScore = 0
    answers.forEach((answerIdx: number, qIdx: number) => {
      if (HEALTH_QUESTIONS[qIdx]?.options[answerIdx]) {
        totalScore += HEALTH_QUESTIONS[qIdx].options[answerIdx].score
      }
    })

    const suggestions: string[] = []
    if (answers[0] >= 2) suggestions.push('叶片状态不佳，检查是否缺水或光照不足，可适当修剪枯叶')
    if (answers[1] >= 2) suggestions.push('土壤干湿情况需要注意，调整浇水频率，保持适度湿润')
    if (answers[2] >= 2) suggestions.push('生长缓慢，可适当添加营养液，检查根系是否健康')
    if (answers[3] >= 2) suggestions.push('光照条件不合适，调整植物摆放位置，保证适度光照')
    if (totalScore >= 80) suggestions.push('植物整体状态良好，继续保持当前养护方式')
    if (totalScore < 60) suggestions.push('植物需要特别关注，建议增加观察频率，及时处理问题')
    if (suggestions.length === 0) suggestions.push('植物状态良好，继续保持规律的养护习惯')

    const report: HealthReport = {
      id: uuidv4(),
      plantId: req.params.id,
      score: totalScore,
      suggestions,
      date: new Date().toISOString().split('T')[0],
      answers
    }

    await db.read()
    db.data!.healthReports.push(report)
    await db.write()
    res.json(report)
  } catch (error) {
    res.status(500).json({ error: '健康检测失败' })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
