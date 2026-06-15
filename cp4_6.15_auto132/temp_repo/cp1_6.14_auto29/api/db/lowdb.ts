// 调用关系：被 routes/points.ts, routes/products.ts, routes/exchange.ts 引用
// 负责 lowdb 数据库初始化、默认数据、读写操作封装

import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import type { User, Product, ExchangeRecord } from '../types.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface DatabaseData {
  user: User
  products: Product[]
  weekPoints: number[]
  monthPoints: number[]
  history: ExchangeRecord[]
}

const dataDir = path.join(__dirname, '..', 'data')
const file = path.join(dataDir, 'db.json')

const defaultData: DatabaseData = {
  user: {
    id: 'user_001',
    name: '社区居民',
    totalPoints: 1580,
    avatar: '',
  },
  products: [
    { id: 'p001', name: '环保袋', points: 50, stock: 100, description: '可循环使用的环保购物袋', iconType: 'bag', iconColor: '#4CAF50' },
    { id: 'p002', name: '再生水杯', points: 80, stock: 50, description: '由再生材料制成的水杯', iconType: 'cup', iconColor: '#2196F3' },
    { id: 'p003', name: '绿植盆栽', points: 120, stock: 30, description: '净化空气的绿色植物', iconType: 'plant', iconColor: '#8BC34A' },
    { id: 'p004', name: '旧物回收箱', points: 200, stock: 20, description: '家庭旧物分类回收箱', iconType: 'box', iconColor: '#8D6E63' },
    { id: 'p005', name: '折叠雨伞', points: 150, stock: 40, description: '轻便易携带的折叠伞', iconType: 'umbrella', iconColor: '#FFB74D' },
    { id: 'p006', name: '饮料瓶兑换券', points: 30, stock: 200, description: '可兑换一瓶饮料的兑换券', iconType: 'bottle', iconColor: '#03A9F4' },
    { id: 'p007', name: '竹制餐具', points: 90, stock: 60, description: '环保竹制餐具套装', iconType: 'box', iconColor: '#CDDC39' },
    { id: 'p008', name: '节能灯泡', points: 60, stock: 80, description: '低能耗LED节能灯泡', iconType: 'bottle', iconColor: '#FFC107' },
    { id: 'p009', name: '有机肥皂', points: 70, stock: 70, description: '纯天然有机肥皂', iconType: 'bottle', iconColor: '#E91E63' },
    { id: 'p010', name: '纸质笔记本', points: 45, stock: 120, description: '再生纸制作的笔记本', iconType: 'box', iconColor: '#795548' },
    { id: 'p011', name: '棉麻购物袋', points: 65, stock: 90, description: '棉麻材质环保购物袋', iconType: 'bag', iconColor: '#9C27B0' },
    { id: 'p012', name: '太阳能充电宝', points: 350, stock: 15, description: '太阳能充电便携充电宝', iconType: 'box', iconColor: '#FF5722' },
    { id: 'p013', name: '植物种子套装', points: 85, stock: 55, description: '多种植物种子套装', iconType: 'plant', iconColor: '#66BB6A' },
    { id: 'p014', name: '二手书籍盲盒', points: 110, stock: 25, description: '随机二手书籍惊喜盲盒', iconType: 'box', iconColor: '#3F51B5' },
    { id: 'p015', name: '环保布袋', points: 40, stock: 150, description: '简约环保布袋', iconType: 'bag', iconColor: '#00BCD4' },
  ],
  weekPoints: [120, 85, 150, 90, 200, 180, 65],
  monthPoints: [
    50, 60, 45, 70, 80, 55, 90, 100, 85, 110,
    95, 120, 105, 130, 115, 140, 125, 150, 135, 160,
    145, 170, 155, 180, 165, 190, 175, 200, 185, 210,
  ],
  history: [
    { id: 'h001', productId: 'p001', productName: '环保袋', quantity: 2, points: 100, date: '2026-06-13' },
    { id: 'h002', productId: 'p008', productName: '节能灯泡', quantity: 3, points: 180, date: '2026-06-12' },
    { id: 'h003', productId: 'p006', productName: '饮料瓶兑换券', quantity: 5, points: 150, date: '2026-06-11' },
    { id: 'h004', productId: 'p003', productName: '绿植盆栽', quantity: 1, points: 120, date: '2026-06-10' },
    { id: 'h005', productId: 'p010', productName: '纸质笔记本', quantity: 2, points: 90, date: '2026-06-09' },
    { id: 'h006', productId: 'p007', productName: '竹制餐具', quantity: 1, points: 90, date: '2026-06-08' },
    { id: 'h007', productId: 'p009', productName: '有机肥皂', quantity: 2, points: 140, date: '2026-06-07' },
    { id: 'h008', productId: 'p013', productName: '植物种子套装', quantity: 1, points: 85, date: '2026-06-06' },
    { id: 'h009', productId: 'p015', productName: '环保布袋', quantity: 3, points: 120, date: '2026-06-05' },
    { id: 'h010', productId: 'p002', productName: '再生水杯', quantity: 1, points: 80, date: '2026-06-04' },
    { id: 'h011', productId: 'p011', productName: '棉麻购物袋', quantity: 2, points: 130, date: '2026-06-03' },
    { id: 'h012', productId: 'p005', productName: '折叠雨伞', quantity: 1, points: 150, date: '2026-06-02' },
    { id: 'h013', productId: 'p012', productName: '太阳能充电宝', quantity: 1, points: 350, date: '2026-06-01' },
    { id: 'h014', productId: 'p004', productName: '旧物回收箱', quantity: 1, points: 200, date: '2026-05-31' },
    { id: 'h015', productId: 'p014', productName: '二手书籍盲盒', quantity: 2, points: 220, date: '2026-05-30' },
    { id: 'h016', productId: 'p001', productName: '环保袋', quantity: 1, points: 50, date: '2026-05-29' },
    { id: 'h017', productId: 'p003', productName: '绿植盆栽', quantity: 2, points: 240, date: '2026-05-28' },
    { id: 'h018', productId: 'p006', productName: '饮料瓶兑换券', quantity: 10, points: 300, date: '2026-05-27' },
    { id: 'h019', productId: 'p008', productName: '节能灯泡', quantity: 2, points: 120, date: '2026-05-26' },
    { id: 'h020', productId: 'p010', productName: '纸质笔记本', quantity: 3, points: 135, date: '2026-05-25' },
    { id: 'h021', productId: 'p002', productName: '再生水杯', quantity: 2, points: 160, date: '2026-05-24' },
    { id: 'h022', productId: 'p007', productName: '竹制餐具', quantity: 2, points: 180, date: '2026-05-23' },
    { id: 'h023', productId: 'p009', productName: '有机肥皂', quantity: 1, points: 70, date: '2026-05-22' },
    { id: 'h024', productId: 'p013', productName: '植物种子套装', quantity: 2, points: 170, date: '2026-05-21' },
    { id: 'h025', productId: 'p015', productName: '环保布袋', quantity: 2, points: 80, date: '2026-05-20' },
    { id: 'h026', productId: 'p011', productName: '棉麻购物袋', quantity: 1, points: 65, date: '2026-05-19' },
    { id: 'h027', productId: 'p005', productName: '折叠雨伞', quantity: 2, points: 300, date: '2026-05-18' },
    { id: 'h028', productId: 'p001', productName: '环保袋', quantity: 3, points: 150, date: '2026-05-17' },
    { id: 'h029', productId: 'p004', productName: '旧物回收箱', quantity: 2, points: 400, date: '2026-05-16' },
    { id: 'h030', productId: 'p012', productName: '太阳能充电宝', quantity: 1, points: 350, date: '2026-05-15' },
  ],
}

const adapter = new JSONFile<DatabaseData>(file)
const db: Low<DatabaseData> = new Low<DatabaseData>(adapter, defaultData)

;(async () => {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }

    try {
      await db.read()
    } catch {
      db.data = defaultData
    }

    if (db.data === null || Object.keys(db.data).length === 0) {
      db.data = defaultData
    }

    try {
      await db.write()
    } catch (writeError) {
      console.error('Failed to write database file:', writeError)
    }
  } catch (initError) {
    console.error('Database initialization error:', initError)
    db.data = defaultData
  }
})()

export default db
