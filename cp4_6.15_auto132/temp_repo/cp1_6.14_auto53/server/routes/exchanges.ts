import { Router } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import {
  createExchange,
  getExchangeById,
  hasExistingExchange,
  getExchangesByUser,
  acceptExchange,
  rejectExchange,
  completeExchange,
} from '../services/exchangesService'
import { getItemById } from '../services/itemsService'
import { getUserById, getPublicUser } from '../services/usersService'

const router = Router()

router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { itemId, message } = req.body
    const requesterId = req.userId!

    if (!itemId) {
      return res.status(400).json({ message: '缺少物品ID' })
    }

    if (message && message.length > 200) {
      return res.status(400).json({ message: '留言不能超过200字' })
    }

    const item = await getItemById(itemId)
    if (!item) {
      return res.status(404).json({ message: '物品不存在' })
    }

    if (item.ownerId === requesterId) {
      return res.status(400).json({ message: '不能与自己发起交换' })
    }

    if (item.status !== 'available') {
      return res.status(400).json({ message: '该物品暂不可交换' })
    }

    const existing = await hasExistingExchange(itemId, requesterId)
    if (existing) {
      return res.status(400).json({ message: '你已发起过交换请求' })
    }

    const exchange = await createExchange({
      itemId,
      requesterId,
      ownerId: item.ownerId,
      message: message || '',
    })

    res.status(201).json(exchange)
  } catch (error) {
    console.error('Create exchange error:', error)
    res.status(500).json({ message: '发起交换请求失败' })
  }
})

router.get('/mine', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!
    const exchanges = await getExchangesByUser(userId)

    const enriched = await Promise.all(
      exchanges.map(async (exchange) => {
        const item = await getItemById(exchange.itemId)
        const requester = await getUserById(exchange.requesterId)
        const owner = await getUserById(exchange.ownerId)
        return {
          ...exchange,
          item: item ? { id: item.id, title: item.title, images: item.images } : null,
          requester: requester ? getPublicUser(requester) : null,
          owner: owner ? getPublicUser(owner) : null,
        }
      })
    )

    res.json(enriched)
  } catch (error) {
    console.error('Get my exchanges error:', error)
    res.status(500).json({ message: '获取交换记录失败' })
  }
})

router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const exchange = await getExchangeById(req.params.id)
    if (!exchange) {
      return res.status(404).json({ message: '交换记录不存在' })
    }

    if (
      exchange.requesterId !== req.userId &&
      exchange.ownerId !== req.userId
    ) {
      return res.status(403).json({ message: '无权限查看' })
    }

    const item = await getItemById(exchange.itemId)
    const requester = await getUserById(exchange.requesterId)
    const owner = await getUserById(exchange.ownerId)

    res.json({
      ...exchange,
      item: item ? { id: item.id, title: item.title, images: item.images } : null,
      requester: requester ? getPublicUser(requester) : null,
      owner: owner ? getPublicUser(owner) : null,
    })
  } catch (error) {
    console.error('Get exchange error:', error)
    res.status(500).json({ message: '获取交换详情失败' })
  }
})

router.post('/:id/accept', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const exchange = await getExchangeById(req.params.id)
    if (!exchange) {
      return res.status(404).json({ message: '交换记录不存在' })
    }

    if (exchange.ownerId !== req.userId) {
      return res.status(403).json({ message: '无权限操作' })
    }

    const updated = await acceptExchange(req.params.id)
    res.json(updated)
  } catch (error) {
    console.error('Accept exchange error:', error)
    res.status(500).json({ message: '同意交换失败' })
  }
})

router.post('/:id/reject', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const exchange = await getExchangeById(req.params.id)
    if (!exchange) {
      return res.status(404).json({ message: '交换记录不存在' })
    }

    if (exchange.ownerId !== req.userId) {
      return res.status(403).json({ message: '无权限操作' })
    }

    const updated = await rejectExchange(req.params.id)
    res.json(updated)
  } catch (error) {
    console.error('Reject exchange error:', error)
    res.status(500).json({ message: '拒绝交换失败' })
  }
})

router.post('/:id/rate', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { rating, comment } = req.body
    const raterId = req.userId!

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: '评分必须在1-5之间' })
    }

    const exchange = await getExchangeById(req.params.id)
    if (!exchange) {
      return res.status(404).json({ message: '交换记录不存在' })
    }

    if (
      exchange.requesterId !== raterId &&
      exchange.ownerId !== raterId
    ) {
      return res.status(403).json({ message: '无权限操作' })
    }

    if (exchange.status === 'completed') {
      return res.status(400).json({ message: '交换已完成，不能重复评价' })
    }

    if (exchange.status !== 'accepted') {
      return res.status(400).json({ message: '当前状态不能评价' })
    }

    const updated = await completeExchange(
      req.params.id,
      raterId,
      Number(rating),
      comment || ''
    )

    res.json(updated)
  } catch (error) {
    console.error('Rate exchange error:', error)
    res.status(500).json({ message: '评价失败' })
  }
})

export default router
