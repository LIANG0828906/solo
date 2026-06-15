import { Router, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db, {
  getItems,
  getItemById,
  insertItem,
  updateItemStatus,
  updateUserPoints,
  insertTransaction,
  getUserById,
  type DBUser
} from '../db.js'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'

const router = Router()

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const items = getItems.all() as Array<{
      id: string
      title: string
      description?: string
      points: number
      image?: string
      status: string
      owner_id: string
      created_at: string
      owner_username: string
      owner_avatar?: string
      owner_reputation: number
    }>

    const formattedItems = items.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      points: item.points,
      image: item.image,
      status: item.status,
      created_at: item.created_at,
      owner: {
        id: item.owner_id,
        username: item.owner_username,
        avatar: item.owner_avatar,
        reputation: item.owner_reputation
      }
    }))

    res.json({
      success: true,
      data: formattedItems
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取物品列表失败'
    })
  }
})

router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, points, image } = req.body
    const userId = req.user!.id

    if (!title || !points) {
      res.status(400).json({
        success: false,
        error: '物品名称和积分不能为空'
      })
      return
    }

    if (points < 1) {
      res.status(400).json({
        success: false,
        error: '积分数值必须大于0'
      })
      return
    }

    const itemId = uuidv4()

    const insertResult = insertItem.run(itemId, title, description, points, image, userId)

    if (insertResult.changes === 0) {
      res.status(500).json({
        success: false,
        error: '发布物品失败'
      })
      return
    }

    const updateResult = updateUserPoints.run(10, userId)
    if (updateResult.changes === 0) {
      res.status(500).json({
        success: false,
        error: '积分奖励发放失败'
      })
      return
    }

    const transactionId = uuidv4()
    insertTransaction.run(
      transactionId,
      'reward',
      userId,
      itemId,
      10,
      `发布物品获得积分奖励`
    )

    const updatedUser = getUserById(userId)!
    const { password, ...userWithoutPassword } = updatedUser

    res.status(201).json({
      success: true,
      data: {
        itemId,
        points: userWithoutPassword.points
      },
      message: '发布物品成功，获得10积分奖励'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '发布物品失败'
    })
  }
})

router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const item = getItemById.get(id)

    if (!item) {
      res.status(404).json({
        success: false,
        error: '物品不存在'
      })
      return
    }

    const formattedItem = {
      id: item.id,
      title: item.title,
      description: item.description,
      points: item.points,
      image: item.image,
      status: item.status,
      created_at: item.created_at,
      owner: {
        id: item.owner_id,
        username: item.owner_username,
        avatar: item.owner_avatar,
        reputation: item.owner_reputation
      }
    }

    res.json({
      success: true,
      data: formattedItem
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取物品详情失败'
    })
  }
})

router.post('/:id/exchange', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const transaction = db.transaction(() => {
    const { id } = req.params
    const userId = req.user!.id

    const item = getItemById.get(id)
    if (!item) {
      res.status(404).json({
        success: false,
        error: '物品不存在'
      })
      return
    }

    if (item.status !== 'available') {
      res.status(400).json({
        success: false,
        error: '物品已被兑换'
      })
      return
    }

    if (item.owner_id === userId) {
      res.status(400).json({
        success: false,
        error: '不能兑换自己发布的物品'
      })
      return
    }

    const user = getUserById(userId)!
    if (user.points < item.points) {
      res.status(400).json({
        success: false,
        error: '积分不足'
      })
      return
    }

    updateItemStatus.run('exchanged', id)

    updateUserPoints.run(-item.points, userId)

    updateUserPoints.run(item.points, item.owner_id)

    const transactionId1 = uuidv4()
    insertTransaction.run(
      transactionId1,
      'exchange',
      userId,
      id,
      -item.points,
      `兑换物品：${item.title}`
    )

    const transactionId2 = uuidv4()
    insertTransaction.run(
      transactionId2,
      'income',
      item.owner_id,
      id,
      item.points,
      `物品被兑换：${item.title}`
    )

    const updatedUser = getUserById(userId)!
    const { password, ...userWithoutPassword } = updatedUser

    res.json({
      success: true,
      data: {
        points: userWithoutPassword.points
      },
      message: '兑换成功'
    })
  })

  try {
    transaction()
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '兑换失败'
    })
  }
})

export default router
