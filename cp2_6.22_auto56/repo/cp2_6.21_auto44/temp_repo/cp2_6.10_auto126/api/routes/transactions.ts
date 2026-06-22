/**
 * 交易记录API路由
 */
import { Router, type Request, type Response } from 'express'

const router = Router()

interface PrescriptionItem {
  herbId: string
  herbName: string
  dosage: number
  unitPrice: number
}

interface Prescription {
  id: string
  name: string
  createdAt: Date
  items: PrescriptionItem[]
  totalAmount: number
}

interface Transaction {
  id: string
  timestamp: Date
  prescription: Prescription
  totalAmount: number
  handledBy: string
}

interface StockChange {
  herbId: string
  change: number
}

let transactions: Transaction[] = [
  {
    id: 'TXN001',
    timestamp: new Date('2026-06-10T09:30:00'),
    prescription: {
      id: 'RX001',
      name: '四君子汤',
      createdAt: new Date('2026-06-10T09:25:00'),
      items: [
        { herbId: '1', herbName: '甘草', dosage: 2.0, unitPrice: 2.5 },
        { herbId: '3', herbName: '人参', dosage: 3.0, unitPrice: 25.0 },
        { herbId: '4', herbName: '白术', dosage: 3.0, unitPrice: 5.5 },
        { herbId: '5', herbName: '茯苓', dosage: 3.0, unitPrice: 3.0 },
      ],
      totalAmount: 109.0,
    },
    totalAmount: 109.0,
    handledBy: '掌柜',
  },
  {
    id: 'TXN002',
    timestamp: new Date('2026-06-10T10:15:00'),
    prescription: {
      id: 'RX002',
      name: '四物汤',
      createdAt: new Date('2026-06-10T10:10:00'),
      items: [
        { herbId: '6', herbName: '当归', dosage: 3.0, unitPrice: 6.5 },
        { herbId: '10', herbName: '川芎', dosage: 2.0, unitPrice: 5.0 },
        { herbId: '11', herbName: '白芍', dosage: 3.0, unitPrice: 4.8 },
        { herbId: '8', herbName: '熟地黄', dosage: 4.0, unitPrice: 5.5 },
      ],
      totalAmount: 58.9,
    },
    totalAmount: 58.9,
    handledBy: '掌柜',
  },
  {
    id: 'TXN003',
    timestamp: new Date('2026-06-10T14:20:00'),
    prescription: {
      id: 'RX003',
      name: '银翘散',
      createdAt: new Date('2026-06-10T14:15:00'),
      items: [
        { herbId: '13', herbName: '金银花', dosage: 3.0, unitPrice: 6.0 },
        { herbId: '14', herbName: '连翘', dosage: 3.0, unitPrice: 5.2 },
        { herbId: '15', herbName: '桂枝', dosage: 2.0, unitPrice: 3.5 },
      ],
      totalAmount: 40.6,
    },
    totalAmount: 40.6,
    handledBy: '掌柜',
  },
]

export const exportHandler = async (req: Request, res: Response): Promise<void> => {
  const { date } = req.query

  let exportData = transactions

  if (date && typeof date === 'string') {
    const targetDate = new Date(date).toDateString()
    exportData = transactions.filter(
      (t) => new Date(t.timestamp).toDateString() === targetDate,
    )
  }

  const exportJson = {
    exportedAt: new Date().toISOString(),
    period: date || '全部',
    totalTransactions: exportData.length,
    totalAmount: exportData.reduce((sum, t) => sum + t.totalAmount, 0),
    transactions: exportData,
  }

  const fileName = `accounts_${date || 'all'}_${Date.now()}.json`

  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
  res.status(200).json(exportJson)
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { date } = req.query

  let filteredTransactions = transactions

  if (date && typeof date === 'string') {
    const targetDate = new Date(date).toDateString()
    filteredTransactions = transactions.filter(
      (t) => new Date(t.timestamp).toDateString() === targetDate,
    )
  }

  res.status(200).json({
    success: true,
    data: filteredTransactions,
  })
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { prescription, stockChanges } = req.body as {
      prescription: Prescription
      stockChanges: StockChange[]
    }

    if (!prescription) {
      res.status(400).json({
        success: false,
        error: '缺少药方信息',
      })
      return
    }

    const newTransaction: Transaction = {
      id: `TXN${String(transactions.length + 1).padStart(3, '0')}`,
      timestamp: new Date(),
      prescription,
      totalAmount: prescription.totalAmount,
      handledBy: '掌柜',
    }

    transactions.push(newTransaction)

    res.status(201).json({
      success: true,
      data: newTransaction,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '创建交易记录失败',
    })
  }
})

export default router
