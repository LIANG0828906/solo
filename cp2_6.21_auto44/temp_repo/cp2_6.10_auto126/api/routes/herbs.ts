/**
 * 药材管理API路由
 */
import { Router, type Request, type Response } from 'express'

const router = Router()

interface Herb {
  id: string
  name: string
  nature: '辛温' | '甘寒' | '苦寒' | '其他'
  stock: number
  price: number
  unit: string
  origin: string
  contraindications: string[]
  tabooPairs: string[]
}

const mockHerbs: Herb[] = [
  {
    id: '1',
    name: '甘草',
    nature: '甘寒',
    stock: 50,
    price: 2.5,
    unit: '钱',
    origin: '内蒙古',
    contraindications: ['实证中满腹胀忌服'],
    tabooPairs: ['甘遂', '大戟', '芫花', '海藻'],
  },
  {
    id: '2',
    name: '甘遂',
    nature: '苦寒',
    stock: 15,
    price: 8.0,
    unit: '钱',
    origin: '陕西',
    contraindications: ['孕妇禁用', '体弱者慎用'],
    tabooPairs: ['甘草'],
  },
  {
    id: '3',
    name: '人参',
    nature: '甘寒',
    stock: 20,
    price: 25.0,
    unit: '钱',
    origin: '吉林',
    contraindications: ['实证忌服', '反藜芦'],
    tabooPairs: ['藜芦', '五灵脂'],
  },
  {
    id: '4',
    name: '白术',
    nature: '辛温',
    stock: 35,
    price: 5.5,
    unit: '钱',
    origin: '浙江',
    contraindications: ['阴虚燥渴忌服'],
    tabooPairs: [],
  },
  {
    id: '5',
    name: '茯苓',
    nature: '甘寒',
    stock: 45,
    price: 3.0,
    unit: '钱',
    origin: '云南',
    contraindications: ['虚寒精滑忌服'],
    tabooPairs: [],
  },
  {
    id: '6',
    name: '当归',
    nature: '辛温',
    stock: 30,
    price: 6.5,
    unit: '钱',
    origin: '甘肃',
    contraindications: ['湿阻中满忌服', '大便溏泄忌服'],
    tabooPairs: [],
  },
  {
    id: '7',
    name: '黄芪',
    nature: '辛温',
    stock: 40,
    price: 4.0,
    unit: '钱',
    origin: '山西',
    contraindications: ['实证忌服', '阴虚阳亢忌服'],
    tabooPairs: [],
  },
  {
    id: '8',
    name: '黄连',
    nature: '苦寒',
    stock: 25,
    price: 7.5,
    unit: '钱',
    origin: '四川',
    contraindications: ['脾胃虚寒忌服'],
    tabooPairs: [],
  },
  {
    id: '9',
    name: '黄芩',
    nature: '苦寒',
    stock: 28,
    price: 4.5,
    unit: '钱',
    origin: '河北',
    contraindications: ['脾胃虚寒忌服'],
    tabooPairs: [],
  },
  {
    id: '10',
    name: '川芎',
    nature: '辛温',
    stock: 32,
    price: 5.0,
    unit: '钱',
    origin: '四川',
    contraindications: ['阴虚火旺忌服'],
    tabooPairs: [],
  },
  {
    id: '11',
    name: '白芍',
    nature: '甘寒',
    stock: 38,
    price: 4.8,
    unit: '钱',
    origin: '安徽',
    contraindications: ['虚寒腹痛忌服'],
    tabooPairs: ['藜芦'],
  },
  {
    id: '12',
    name: '赤芍',
    nature: '苦寒',
    stock: 22,
    price: 4.2,
    unit: '钱',
    origin: '内蒙古',
    contraindications: ['血虚忌服'],
    tabooPairs: ['藜芦'],
  },
  {
    id: '13',
    name: '金银花',
    nature: '甘寒',
    stock: 42,
    price: 6.0,
    unit: '钱',
    origin: '河南',
    contraindications: ['脾胃虚寒忌服'],
    tabooPairs: [],
  },
  {
    id: '14',
    name: '连翘',
    nature: '苦寒',
    stock: 36,
    price: 5.2,
    unit: '钱',
    origin: '山西',
    contraindications: ['脾胃虚弱忌服'],
    tabooPairs: [],
  },
  {
    id: '15',
    name: '桂枝',
    nature: '辛温',
    stock: 33,
    price: 3.5,
    unit: '钱',
    origin: '广西',
    contraindications: ['温热病忌服', '阴虚火旺忌服'],
    tabooPairs: [],
  },
  {
    id: '16',
    name: '石膏',
    nature: '甘寒',
    stock: 8,
    price: 2.0,
    unit: '钱',
    origin: '山东',
    contraindications: ['脾胃虚寒忌服'],
    tabooPairs: [],
  },
  {
    id: '17',
    name: '半夏',
    nature: '辛温',
    stock: 12,
    price: 5.8,
    unit: '钱',
    origin: '四川',
    contraindications: ['孕妇慎用', '阴虚燥咳忌服'],
    tabooPairs: ['乌头'],
  },
]

/**
 * 获取药材列表
 * GET /api/herbs
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    data: mockHerbs,
  })
})

export default router
