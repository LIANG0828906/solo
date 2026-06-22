/**
 * 摊位管理系统 Express 服务器
 * 提供摊位记录数据和热力计算数据的存储与查询 API
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'

const app: express.Application = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

export interface StandRecord {
  id: string
  lat: number
  lng: number
  address: string
  timeSlot: 'morning' | 'noon' | 'evening'
  categories: string[]
  revenue: number
  createdAt: string
}

export interface HeatmapPoint {
  lat: number
  lng: number
  intensity: number
}

const mockAddresses = [
  '北京市东城区王府井大街',
  '北京市西城区西单北大街',
  '北京市朝阳区三里屯路',
  '北京市海淀区中关村大街',
  '北京市丰台区丰台路',
  '北京市石景山区古城大街',
  '北京市通州区新华大街',
  '北京市朝阳区国贸中心',
  '北京市东城区东直门大街',
  '北京市西城区前门大街',
  '北京市朝阳区望京街',
  '北京市海淀区五道口',
  '北京市朝阳区双井桥',
  '北京市东城区南锣鼓巷',
  '北京市西城区护国寺街',
]

const categories = ['小吃', '饰品', '饮品', '服装', '水果', '蔬菜', '日用品', '手工艺品']
const timeSlots: ('morning' | 'noon' | 'evening')[] = ['morning', 'noon', 'evening']

const generateMockRecords = (): StandRecord[] => {
  const records: StandRecord[] = []
  const centerLat = 39.9042
  const centerLng = 116.4074

  for (let i = 0; i < 50; i++) {
    const latOffset = (Math.random() - 0.5) * 0.1
    const lngOffset = (Math.random() - 0.5) * 0.1
    const daysAgo = Math.floor(Math.random() * 30)
    const createdAt = new Date()
    createdAt.setDate(createdAt.getDate() - daysAgo)

    const numCategories = Math.floor(Math.random() * 3) + 1
    const shuffled = [...categories].sort(() => 0.5 - Math.random())
    const selectedCategories = shuffled.slice(0, numCategories)

    records.push({
      id: uuidv4(),
      lat: centerLat + latOffset,
      lng: centerLng + lngOffset,
      address: mockAddresses[Math.floor(Math.random() * mockAddresses.length)],
      timeSlot: timeSlots[Math.floor(Math.random() * timeSlots.length)],
      categories: selectedCategories,
      revenue: Math.floor(Math.random() * 500) + 30,
      createdAt: createdAt.toISOString(),
    })
  }

  return records.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

let records: StandRecord[] = generateMockRecords()

app.get('/api/records', (req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    data: records,
  })
})

app.post('/api/records', (req: Request, res: Response): void => {
  try {
    const { lat, lng, address, timeSlot, categories, revenue } = req.body

    if (
      typeof lat !== 'number' ||
      typeof lng !== 'number' ||
      !address ||
      !timeSlot ||
      !Array.isArray(categories) ||
      categories.length === 0 ||
      typeof revenue !== 'number' ||
      revenue <= 0
    ) {
      res.status(400).json({
        success: false,
        error: 'Invalid request data',
      })
      return
    }

    const newRecord: StandRecord = {
      id: uuidv4(),
      lat,
      lng,
      address,
      timeSlot: timeSlot as 'morning' | 'noon' | 'evening',
      categories,
      revenue,
      createdAt: new Date().toISOString(),
    }

    records = [newRecord, ...records]

    res.status(201).json({
      success: true,
      data: newRecord,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create record',
    })
  }
})

app.get('/api/heatmap', (req: Request, res: Response): void => {
  try {
    const period = (req.query.period as string) || 'month'
    const now = new Date()
    let startDate: Date

    if (period === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    const periodRecords = records.filter(
      (r) => new Date(r.createdAt) >= startDate
    )

    const gridSize = 0.01
    const gridMap = new Map<string, { lat: number; lng: number; totalRevenue: number; count: number }>()

    periodRecords.forEach((record) => {
      const gridLat = Math.floor(record.lat / gridSize) * gridSize + gridSize / 2
      const gridLng = Math.floor(record.lng / gridSize) * gridSize + gridSize / 2
      const key = `${gridLat.toFixed(4)}_${gridLng.toFixed(4)}`

      const existing = gridMap.get(key) || {
        lat: gridLat,
        lng: gridLng,
        totalRevenue: 0,
        count: 0,
      }

      gridMap.set(key, {
        ...existing,
        totalRevenue: existing.totalRevenue + record.revenue,
        count: existing.count + 1,
      })
    })

    const heatmapData: HeatmapPoint[] = Array.from(gridMap.values()).map((grid) => ({
      lat: grid.lat,
      lng: grid.lng,
      intensity: Math.min(Math.floor(grid.totalRevenue / grid.count / 50), 10),
    }))

    res.status(200).json({
      success: true,
      data: heatmapData,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate heatmap data',
    })
  }
})

app.get('/api/health', (req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    message: 'ok',
  })
})

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Server error:', error)
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(PORT, () => {
    console.log(`Server ready on port ${PORT}`)
  })
}

export default app
