import { Router, type Request, type Response } from 'express'
import db from '../db/lowdb.js'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId, quantity } = req.body as { productId: string; quantity: number }

    if (!productId || !quantity || quantity <= 0) {
      res.status(400).json({
        success: false,
        message: '参数错误：请提供有效的商品ID和数量',
      })
      return
    }

    await db.read()
    const data = db.data!

    const product = data.products.find((p) => p.id === productId)

    if (!product) {
      res.status(404).json({
        success: false,
        message: '商品不存在',
      })
      return
    }

    if (product.stock < quantity) {
      res.status(400).json({
        success: false,
        message: '库存不足',
      })
      return
    }

    const totalPoints = product.points * quantity

    if (data.user.totalPoints < totalPoints) {
      res.status(400).json({
        success: false,
        message: '积分不足',
      })
      return
    }

    product.stock -= quantity
    data.user.totalPoints -= totalPoints

    const exchangeRecord = {
      id: uuidv4(),
      productId: product.id,
      productName: product.name,
      quantity,
      points: totalPoints,
      date: new Date().toISOString().split('T')[0],
    }

    data.history.unshift(exchangeRecord)

    await db.write()

    res.status(200).json({
      success: true,
      message: '兑换成功',
      data: {
        record: exchangeRecord,
        remainingPoints: data.user.totalPoints,
        remainingStock: product.stock,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '兑换失败：服务器内部错误',
    })
  }
})

export default router
