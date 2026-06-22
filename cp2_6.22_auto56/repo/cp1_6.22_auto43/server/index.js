import express from 'express'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

let travels = [
  {
    id: uuidv4(),
    city: '北京',
    startDate: '2026-07-01',
    days: 3,
    icon: '🏯',
    budget: 3000,
    spots: [
      {
        id: uuidv4(),
        day: 1,
        name: '故宫博物院',
        lat: 39.9163,
        lng: 116.3972,
        cost: 60,
        category: '门票',
        description: '中国明清两代的皇家宫殿',
      },
      {
        id: uuidv4(),
        day: 1,
        name: '天安门广场',
        lat: 39.9055,
        lng: 116.3976,
        cost: 0,
        category: '景点',
        description: '世界上最大的城市广场',
      },
      {
        id: uuidv4(),
        day: 2,
        name: '长城（八达岭）',
        lat: 40.3576,
        lng: 116.0204,
        cost: 40,
        category: '门票',
        description: '世界文化遗产',
      },
    ],
  },
]

const spotLibrary = [
  { id: '1', name: '故宫博物院', city: '北京', lat: 39.9163, lng: 116.3972, description: '中国明清两代的皇家宫殿' },
  { id: '2', name: '天安门广场', city: '北京', lat: 39.9055, lng: 116.3976, description: '世界上最大的城市广场' },
  { id: '3', name: '长城（八达岭）', city: '北京', lat: 40.3576, lng: 116.0204, description: '世界文化遗产' },
  { id: '4', name: '颐和园', city: '北京', lat: 39.9999, lng: 116.2755, description: '中国现存最大的皇家园林' },
  { id: '5', name: '天坛', city: '北京', lat: 39.8882, lng: 116.4171, description: '明清皇帝祭天之所' },
  { id: '6', name: '外滩', city: '上海', lat: 31.2304, lng: 121.4998, description: '上海的标志性景观' },
  { id: '7', name: '东方明珠', city: '上海', lat: 31.2397, lng: 121.4998, description: '上海地标性建筑' },
  { id: '8', name: '豫园', city: '上海', lat: 31.2272, lng: 121.4925, description: '江南古典园林' },
  { id: '9', name: '西湖', city: '杭州', lat: 30.2741, lng: 120.1551, description: '世界文化遗产' },
  { id: '10', name: '灵隐寺', city: '杭州', lat: 30.2418, lng: 120.1010, description: '中国佛教著名寺院' },
  { id: '11', name: '千岛湖', city: '杭州', lat: 29.6092, lng: 119.0376, description: '国家5A级旅游景区' },
  { id: '12', name: '成都大熊猫基地', city: '成都', lat: 30.7323, lng: 104.1365, description: '大熊猫繁育研究基地' },
  { id: '13', name: '锦里古街', city: '成都', lat: 30.6476, lng: 104.0563, description: '成都著名的商业步行街' },
  { id: '14', name: '宽窄巷子', city: '成都', lat: 30.6739, lng: 104.0629, description: '成都历史文化保护区' },
  { id: '15', name: '鼓浪屿', city: '厦门', lat: 24.4473, lng: 118.0665, description: '世界文化遗产' },
  { id: '16', name: '南普陀寺', city: '厦门', lat: 24.4453, lng: 118.0894, description: '闽南佛教胜地' },
]

const cityIcons = ['🏯', '🗼', '🏰', '🌆', '🏙️', '🌃', '⛩️', '🏛️', '🕌', '🕍', '🌇', '🎑']

app.get('/api/travels', (req, res) => {
  res.json(travels)
})

app.get('/api/travels/:id', (req, res) => {
  const travel = travels.find((t) => t.id === req.params.id)
  if (!travel) {
    return res.status(404).json({ error: '旅行计划不存在' })
  }
  res.json(travel)
})

app.post('/api/travels', (req, res) => {
  const { city, startDate, days, budget } = req.body
  if (!city || !startDate || !days) {
    return res.status(400).json({ error: '缺少必要信息' })
  }
  const icon = cityIcons[Math.floor(Math.random() * cityIcons.length)]
  const newTravel = {
    id: uuidv4(),
    city,
    startDate,
    days: Number(days),
    icon,
    budget: Number(budget) || 0,
    spots: [],
  }
  travels.unshift(newTravel)
  res.status(201).json(newTravel)
})

app.delete('/api/travels/:id', (req, res) => {
  const index = travels.findIndex((t) => t.id === req.params.id)
  if (index === -1) {
    return res.status(404).json({ error: '旅行计划不存在' })
  }
  travels.splice(index, 1)
  res.json({ message: '删除成功' })
})

app.get('/api/spots', (req, res) => {
  const { city } = req.query
  if (city) {
    const filtered = spotLibrary.filter((s) => s.city === city)
    return res.json(filtered)
  }
  res.json(spotLibrary)
})

app.post('/api/travels/:id/spots', (req, res) => {
  const travel = travels.find((t) => t.id === req.params.id)
  if (!travel) {
    return res.status(404).json({ error: '旅行计划不存在' })
  }
  const { day, name, lat, lng, cost, category, description } = req.body
  const newSpot = {
    id: uuidv4(),
    day: Number(day),
    name,
    lat: Number(lat),
    lng: Number(lng),
    cost: Number(cost) || 0,
    category: category || '景点',
    description: description || '',
  }
  travel.spots.push(newSpot)
  res.status(201).json(newSpot)
})

app.put('/api/travels/:id/spots/:spotId', (req, res) => {
  const travel = travels.find((t) => t.id === req.params.id)
  if (!travel) {
    return res.status(404).json({ error: '旅行计划不存在' })
  }
  const spot = travel.spots.find((s) => s.id === req.params.spotId)
  if (!spot) {
    return res.status(404).json({ error: '景点不存在' })
  }
  const { day, name, lat, lng, cost, category, description } = req.body
  if (day !== undefined) spot.day = Number(day)
  if (name !== undefined) spot.name = name
  if (lat !== undefined) spot.lat = Number(lat)
  if (lng !== undefined) spot.lng = Number(lng)
  if (cost !== undefined) spot.cost = Number(cost)
  if (category !== undefined) spot.category = category
  if (description !== undefined) spot.description = description
  res.json(spot)
})

app.delete('/api/travels/:id/spots/:spotId', (req, res) => {
  const travel = travels.find((t) => t.id === req.params.id)
  if (!travel) {
    return res.status(404).json({ error: '旅行计划不存在' })
  }
  const index = travel.spots.findIndex((s) => s.id === req.params.spotId)
  if (index === -1) {
    return res.status(404).json({ error: '景点不存在' })
  }
  travel.spots.splice(index, 1)
  res.json({ message: '删除成功' })
})

app.put('/api/travels/:id/spots/reorder', (req, res) => {
  const travel = travels.find((t) => t.id === req.params.id)
  if (!travel) {
    return res.status(404).json({ error: '旅行计划不存在' })
  }
  const { day, spotIds } = req.body
  const daySpots = travel.spots.filter((s) => s.day === Number(day))
  const otherSpots = travel.spots.filter((s) => s.day !== Number(day))
  
  const reorderedSpots = spotIds.map((id) => daySpots.find((s) => s.id === id)).filter(Boolean)
  
  travel.spots = [...otherSpots, ...reorderedSpots]
  res.json({ message: '排序成功' })
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
