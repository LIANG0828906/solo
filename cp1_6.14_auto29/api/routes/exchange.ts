// 调用关系：被 app.ts 引用，引用 db/lowdb.ts
// 处理商品兑换相关的 POST 请求

import { Router, type Request, type Response } from 'express'
import db from '../db/lowdb.js'
import { v4 as uuidv4 } from 'uuid'
import { ValidationError, NotFoundError } from '../app.js'

const router = Router()

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId, quantity } = req.body as { productId: unknown; quantity: unknown }

    if (typeof productId !== 'string' || productId.trim() === '') {
      throw new ValidationError('参数错误：商品ID必须为非空字符串')
    }

    if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity <= 0) {
      throw new ValidationError('参数错误：数量必须为正整数')
    }

    if (!productId || !quantity || quantity <= 0) {
      res.status(400).json({
        success: false,
        message: '参数错误：请提供有效的商品ID和数量',
      })
      return
    }

    try {
      await db.read()
    } catch {
      throw new Error('数据库读取失败')
    }

    const data = db.data
    if (!data) {
      throw new Error('数据库未初始化')
    }

    const product = data.products.find((p: { id: string }) => p.id === productId)

    if (!product) {
      throw new NotFoundError('商品不存在')
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

    try {
      await db.write()
    } catch {
      throw new Error('数据库写入失败')
    }

    res.status(200).json({
      success: true,
      message: `兑换成功！消耗 ${totalPoints} 积分`,
      data: {
        record: exchangeRecord,
        remainingPoints: data.user.totalPoints,
        remainingStock: product.stock,
      },
    })
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({
        success: false,
        message: error.message || '参数错误',
      })
      return
    }
    if (error instanceof NotFoundError) {
      res.status(404).json({
        success: false,
        message: error.message || '资源不存在',
      })
      return
    }
    const errorMessage = error instanceof Error ? error.message : '服务器内部错误'
    res.status(500).json({
      success: false,
      message: `兑换失败：${errorMessage}`,
    })
  }
})

export default router
