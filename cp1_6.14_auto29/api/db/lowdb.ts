import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import path from 'path'
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

const file = path.join(__dirname, '..', 'data', 'db.json')
const adapter = new JSONFile<DatabaseData>(file)

const defaultData: DatabaseData = {
  user: {
    id: 'user_001',
    name: '社区居民',
    totalPoints: 1580,
    avatar: '',
  },
  products: [
    { id: 'p001', name: '环保袋', points: 50, stock: 100, description: '可循环使用的环保购物袋' },
    { id: 'p002', name: '再生水杯', points: 80, stock: 50, description: '由再生材料制成的水杯' },
    { id: 'p003', name: '绿植盆栽', points: 120, stock: 30, description: '净化空气的绿色植物' },
    { id: 'p004', name: '旧物回收箱', points: 200, stock: 20, description: '家庭旧物分类回收箱' },
    { id: 'p005', name: '折叠雨伞', points: 150, stock: 40, description: '轻便易携带的折叠伞' },
    { id: 'p006', name: '饮料瓶兑换券', points: 30, stock: 200, description: '可兑换一瓶饮料的兑换券' },
    { id: 'p007', name: '竹制餐具', points: 90, stock: 60, description: '环保竹制餐具套装' },
    { id: 'p008', name: '节能灯泡', points: 60, stock: 80, description: '低能耗LED节能灯泡' },
    { id: 'p009', name: '有机肥皂', points: 70, stock: 70, description: '纯天然有机肥皂' },
    { id: 'p010', name: '纸质笔记本', points: 45, stock: 120, description: '再生纸制作的笔记本' },
    { id: 'p011', name: '棉麻购物袋', points: 65, stock: 90, description: '棉麻材质环保购物袋' },
    { id: 'p012', name: '太阳能充电宝', points: 350, stock: 15, description: '太阳能充电便携充电宝' },
    { id: 'p013', name: '植物种子套装', points: 85, stock: 55, description: '多种植物种子套装' },
    { id: 'p014', name: '二手书籍盲盒', points: 110, stock: 25, description: '随机二手书籍惊喜盲盒' },
    { id: 'p015', name: '环保布袋', points: 40, stock: 150, description: '简约环保布袋' },
  ],
  weekPoints: [120, 85, 150, 90, 200, 180, 65],
  monthPoints: [
    50, 60, 45, 70, 80, 55, 90, 100, 85, 110,
    95, 120, 105, 130, 115, 140, 125, 150, 135, 160,
    145, 170, 155, 180, 165, 190, 175, 200, 185, 210,
  ],
  history: [
    { id: 'h001', productId: 'p001', productName: '环保袋', quantity: 2, points: 100, date: '2026-06-10' },
    { id: 'h002', productId: 'p008', productName: '节能灯泡', quantity: 3, points: 180, date: '2026-06-08' },
    { id: 'h003', productId: 'p006', productName: '饮料瓶兑换券', quantity: 5, points: 150, date: '2026-06-05' },
    { id: 'h004', productId: 'p003', productName: '绿植盆栽', quantity: 1, points: 120, date: '2026-06-03' },
    { id: 'h005', productId: 'p010', productName: '纸质笔记本', quantity: 2, points: 90, date: '2026-06-01' },
    { id: 'h006', productId: 'p007', productName: '竹制餐具', quantity: 1, points: 90, date: '2026-05-28' },
    { id: 'h007', productId: 'p009', productName: '有机肥皂', quantity: 2, points: 140, date: '2026-05-25' },
    { id: 'h008', productId: 'p013', productName: '植物种子套装', quantity: 1, points: 85, date: '2026-05-20' },
    { id: 'h009', productId: 'p015', productName: '环保布袋', quantity: 3, points: 120, date: '2026-05-15' },
    { id: 'h010', productId: 'p002', productName: '再生水杯', quantity: 1, points: 80, date: '2026-05-10' },
  ],
}

const db = new Low<DatabaseData>(adapter, defaultData)

await db.read()

if (db.data === null || Object.keys(db.data).length === 0) {
  db.data = defaultData
  await db.write()
}

export default db
