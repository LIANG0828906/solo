import express from 'express'
import cors from 'cors'

const app = express()
app.use(cors())
app.use(express.json())

const gardenZones = [
  {
    id: 'zone-a',
    name: 'A区',
    area: 12,
    sunlightHours: 8,
    currentCrop: '番茄',
    growthStage: 'growing',
    daysToHarvest: 25,
    totalDays: 90,
    history: [
      { crop: '生菜', season: '春', year: 2025 },
      { crop: '番茄', season: '夏', year: 2025 },
    ],
  },
  {
    id: 'zone-b',
    name: 'B区',
    area: 8,
    sunlightHours: 5,
    currentCrop: '菠菜',
    growthStage: 'seedling',
    daysToHarvest: 40,
    totalDays: 60,
    history: [
      { crop: '萝卜', season: '冬', year: 2024 },
      { crop: '菠菜', season: '春', year: 2025 },
    ],
  },
  {
    id: 'zone-c',
    name: 'C区',
    area: 15,
    sunlightHours: 10,
    currentCrop: '黄瓜',
    growthStage: 'harvest',
    daysToHarvest: 3,
    totalDays: 70,
    history: [
      { crop: '豌豆', season: '春', year: 2025 },
      { crop: '黄瓜', season: '夏', year: 2025 },
    ],
  },
  {
    id: 'zone-d',
    name: 'D区',
    area: 10,
    sunlightHours: 6,
    currentCrop: '辣椒',
    growthStage: 'growing',
    daysToHarvest: 35,
    totalDays: 100,
    history: [
      { crop: '白菜', season: '秋', year: 2024 },
      { crop: '辣椒', season: '夏', year: 2025 },
    ],
  },
  {
    id: 'zone-e',
    name: 'E区',
    area: 6,
    sunlightHours: 4,
    currentCrop: '韭菜',
    growthStage: 'growing',
    daysToHarvest: 15,
    totalDays: 45,
    history: [
      { crop: '葱', season: '春', year: 2025 },
      { crop: '韭菜', season: '夏', year: 2025 },
    ],
  },
  {
    id: 'zone-f',
    name: 'F区',
    area: 20,
    sunlightHours: 9,
    currentCrop: '茄子',
    growthStage: 'seedling',
    daysToHarvest: 50,
    totalDays: 95,
    history: [
      { crop: '土豆', season: '春', year: 2025 },
      { crop: '茄子', season: '夏', year: 2025 },
    ],
  },
]

const rotationPlans = {
  'zone-a': {
    optimal: {
      crop: '胡萝卜',
      reason: '番茄为深根系作物，消耗深层土壤养分；胡萝卜为浅根系，可有效利用表层养分，且喜阳特性与A区8小时日照完美匹配，根系深浅互补修复土壤结构。',
      soilCompatibility: 92,
    },
    alternative: {
      crop: '生菜',
      reason: '生菜生长周期短(30-45天)，可快速轮换，适合在深根作物后补充浅层有机质，但耐热性一般，需注意夏季遮阳。',
      soilCompatibility: 75,
    },
  },
  'zone-b': {
    optimal: {
      crop: '小白菜',
      reason: '菠菜属叶菜类耗氮较多；小白菜同样为叶菜但根系更浅，可配合施氮快速恢复地力，且耐阴性适合B区5小时日照条件。',
      soilCompatibility: 88,
    },
    alternative: {
      crop: '萝卜',
      reason: '萝卜为根菜类，可疏松土壤深层，改善B区因连续叶菜种植导致的板结问题，但需至少6小时日照，B区光照稍显不足。',
      soilCompatibility: 70,
    },
  },
  'zone-c': {
    optimal: {
      crop: '豇豆',
      reason: '黄瓜为高耗肥作物；豇豆为豆科植物，具有固氮能力，可有效补充土壤氮素，恢复C区连作后的肥力消耗，喜阳特性匹配10小时日照。',
      soilCompatibility: 95,
    },
    alternative: {
      crop: '秋葵',
      reason: '秋葵深根系可改善土壤通透性，与黄瓜浅根系形成互补，且耐热耐阳，适合C区强光照环境。',
      soilCompatibility: 80,
    },
  },
  'zone-d': {
    optimal: {
      crop: '蒜苗',
      reason: '辣椒属茄科，连续种植易积累青枯病菌；蒜苗具有天然杀菌作用，可有效抑制土传病害，且耐半阴适合D区6小时日照。',
      soilCompatibility: 90,
    },
    alternative: {
      crop: '芹菜',
      reason: '芹菜为浅根系作物，与辣椒深根系形成互补，喜凉耐阴适合D区中等光照，但需较多水分管理。',
      soilCompatibility: 72,
    },
  },
  'zone-e': {
    optimal: {
      crop: '葱',
      reason: '韭菜为多年生宿根作物，长期种植消耗特定养分；葱为同科不同属，可利用相似养分通道但消耗模式不同，且耐阴性强匹配E区4小时日照。',
      soilCompatibility: 85,
    },
    alternative: {
      crop: '生菜',
      reason: '生菜浅根系、生长快，可在韭菜休整期快速轮作一季，但需至少5小时散射光，E区光照偏弱需补光。',
      soilCompatibility: 68,
    },
  },
  'zone-f': {
    optimal: {
      crop: '南瓜',
      reason: '茄子为茄科深根系高耗肥作物；南瓜为葫芦科浅根匍匐型，可覆盖地表减少水分蒸发，且固碳能力强，有利于恢复土壤有机质，喜阳匹配9小时日照。',
      soilCompatibility: 91,
    },
    alternative: {
      crop: '玉米',
      reason: '玉米高杆深根，与茄子形成根系层次差异，可有效疏松深层土壤，但占用面积较大需F区20㎡空间，生长周期较长。',
      soilCompatibility: 77,
    },
  },
}

const harvestRecords = [
  { id: '1', date: '2025-01-15', crop: '白菜', weightKg: 8.5, costYuan: 30, revenueYuan: 68 },
  { id: '2', date: '2025-01-28', crop: '萝卜', weightKg: 12.0, costYuan: 25, revenueYuan: 72 },
  { id: '3', date: '2025-02-10', crop: '菠菜', weightKg: 5.2, costYuan: 18, revenueYuan: 42 },
  { id: '4', date: '2025-02-22', crop: '生菜', weightKg: 6.8, costYuan: 20, revenueYuan: 55 },
  { id: '5', date: '2025-03-05', crop: '豌豆', weightKg: 4.0, costYuan: 22, revenueYuan: 48 },
  { id: '6', date: '2025-03-18', crop: '葱', weightKg: 3.5, costYuan: 12, revenueYuan: 35 },
  { id: '7', date: '2025-03-30', crop: '韭菜', weightKg: 4.2, costYuan: 15, revenueYuan: 38 },
  { id: '8', date: '2025-04-12', crop: '土豆', weightKg: 15.0, costYuan: 35, revenueYuan: 90 },
  { id: '9', date: '2025-04-25', crop: '生菜', weightKg: 7.5, costYuan: 22, revenueYuan: 60 },
  { id: '10', date: '2025-05-08', crop: '豌豆', weightKg: 5.8, costYuan: 24, revenueYuan: 52 },
  { id: '11', date: '2025-05-20', crop: '白菜', weightKg: 9.0, costYuan: 28, revenueYuan: 72 },
  { id: '12', date: '2025-06-02', crop: '黄瓜', weightKg: 11.0, costYuan: 30, revenueYuan: 88 },
  { id: '13', date: '2025-06-15', crop: '番茄', weightKg: 14.5, costYuan: 40, revenueYuan: 116 },
  { id: '14', date: '2025-07-03', crop: '辣椒', weightKg: 6.0, costYuan: 28, revenueYuan: 60 },
  { id: '15', date: '2025-07-18', crop: '茄子', weightKg: 8.5, costYuan: 32, revenueYuan: 85 },
  { id: '16', date: '2025-08-05', crop: '秋葵', weightKg: 4.5, costYuan: 25, revenueYuan: 58 },
  { id: '17', date: '2025-08-22', crop: '豇豆', weightKg: 7.2, costYuan: 20, revenueYuan: 65 },
  { id: '18', date: '2025-09-10', crop: '南瓜', weightKg: 18.0, costYuan: 30, revenueYuan: 108 },
  { id: '19', date: '2025-09-28', crop: '胡萝卜', weightKg: 10.5, costYuan: 22, revenueYuan: 75 },
  { id: '20', date: '2025-10-15', crop: '萝卜', weightKg: 13.0, costYuan: 20, revenueYuan: 78 },
  { id: '21', date: '2025-11-02', crop: '蒜苗', weightKg: 3.8, costYuan: 15, revenueYuan: 42 },
  { id: '22', date: '2025-11-20', crop: '芹菜', weightKg: 6.5, costYuan: 18, revenueYuan: 52 },
  { id: '23', date: '2025-12-08', crop: '小白菜', weightKg: 5.0, costYuan: 14, revenueYuan: 40 },
  { id: '24', date: '2025-12-22', crop: '韭菜', weightKg: 4.8, costYuan: 16, revenueYuan: 44 },
  { id: '25', date: '2026-01-10', crop: '白菜', weightKg: 9.5, costYuan: 28, revenueYuan: 76 },
  { id: '26', date: '2026-01-25', crop: '菠菜', weightKg: 6.0, costYuan: 18, revenueYuan: 48 },
  { id: '27', date: '2026-02-12', crop: '葱', weightKg: 4.0, costYuan: 12, revenueYuan: 38 },
  { id: '28', date: '2026-03-01', crop: '生菜', weightKg: 7.2, costYuan: 20, revenueYuan: 58 },
  { id: '29', date: '2026-03-20', crop: '豌豆', weightKg: 5.5, costYuan: 22, revenueYuan: 50 },
  { id: '30', date: '2026-04-08', crop: '土豆', weightKg: 16.0, costYuan: 35, revenueYuan: 96 },
  { id: '31', date: '2026-04-25', crop: '黄瓜', weightKg: 12.5, costYuan: 32, revenueYuan: 100 },
  { id: '32', date: '2026-05-10', crop: '番茄', weightKg: 15.0, costYuan: 42, revenueYuan: 120 },
  { id: '33', date: '2026-05-28', crop: '辣椒', weightKg: 7.0, costYuan: 30, revenueYuan: 70 },
  { id: '34', date: '2026-06-05', crop: '茄子', weightKg: 9.0, costYuan: 34, revenueYuan: 90 },
  { id: '35', date: '2026-06-18', crop: '豇豆', weightKg: 8.0, costYuan: 22, revenueYuan: 72 },
]

app.get('/api/garden-zones', (req, res) => {
  res.json(gardenZones)
})

app.get('/api/rotation-plans', (req, res) => {
  const zoneId = req.query.zoneId
  if (!zoneId || !rotationPlans[zoneId]) {
    return res.json(rotationPlans['zone-a'])
  }
  res.json(rotationPlans[zoneId])
})

app.get('/api/harvest-records', (req, res) => {
  res.json(harvestRecords)
})

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'ok' })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server ready on port ${PORT}`)
})
