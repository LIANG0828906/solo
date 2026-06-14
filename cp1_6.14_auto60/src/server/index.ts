import express from 'express'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'
import moment from 'moment'
import { initDb, db, ExpenseRecord, ExpenseCategory } from './db.js'
import recordsRouter from './routes/records.js'
import reportsRouter from './routes/reports.js'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

app.use('/api/records', recordsRouter)
app.use('/api/reports', reportsRouter)

const categories: ExpenseCategory[] = ['food', 'transport', 'shopping', 'entertainment', 'other']

const foodNotes = [
  '早餐包子豆浆',
  '午餐外卖',
  '晚餐和朋友聚餐',
  '下午茶奶茶',
  '咖啡',
  '水果',
  '超市买菜',
  '夜宵烧烤',
]

const transportNotes = [
  '地铁通勤',
  '打车上班',
  '共享单车',
  '加油',
  '停车费',
  '公交',
]

const shoppingNotes = [
  '日用品采购',
  '衣服',
  '电子产品',
  '书籍',
  '护肤品',
  '家居用品',
]

const entertainmentNotes = [
  '电影票',
  '游戏充值',
  'KTV',
  '健身',
  '演唱会门票',
  '订阅会员',
]

const otherNotes = [
  '话费充值',
  '水电费',
  '房租',
  '礼物',
  '医疗',
  '快递费',
]

function getRandomNote(category: ExpenseCategory): string {
  const notes: Record<ExpenseCategory, string[]> = {
    food: foodNotes,
    transport: transportNotes,
    shopping: shoppingNotes,
    entertainment: entertainmentNotes,
    other: otherNotes,
  }
  const list = notes[category]
  return list[Math.floor(Math.random() * list.length)]
}

function getRandomAmount(category: ExpenseCategory): number {
  const ranges: Record<ExpenseCategory, [number, number]> = {
    food: [10, 120],
    transport: [5, 80],
    shopping: [30, 500],
    entertainment: [20, 200],
    other: [15, 150],
  }
  const [min, max] = ranges[category]
  const amount = Math.random() * (max - min) + min
  return Math.round(amount * 100) / 100
}

async function seedSampleData(): Promise<void> {
  await db.read()

  if (db.data.records.length > 0) {
    console.log('已有数据，跳过示例数据生成')
    return
  }

  const recordCount = 30 + Math.floor(Math.random() * 21)
  const now = moment()

  for (let i = 0; i < recordCount; i++) {
    const daysAgo = Math.floor(Math.random() * 30)
    const date = now.clone().subtract(daysAgo, 'days')
    const category = categories[Math.floor(Math.random() * categories.length)]
    const isoDate = date.toISOString()

    const record: ExpenseRecord = {
      id: uuidv4(),
      amount: getRandomAmount(category),
      category,
      note: getRandomNote(category),
      date: date.format('YYYY-MM-DD'),
      createdAt: isoDate,
      updatedAt: isoDate,
    }

    db.data.records.push(record)
  }

  await db.write()
  console.log(`已生成 ${recordCount} 条示例消费记录`)
}

async function startServer(): Promise<void> {
  try {
    await initDb()
    console.log('数据库初始化成功')

    await seedSampleData()

    app.listen(PORT, () => {
      console.log(`服务器已启动: http://localhost:${PORT}`)
      console.log(`API 记录: http://localhost:${PORT}/api/records`)
      console.log(`API 报告: http://localhost:${PORT}/api/reports/summary`)
    })
  } catch (error) {
    console.error('服务器启动失败:', error)
    process.exit(1)
  }
}

startServer()
