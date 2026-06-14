import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getDB } from '../db.js'

const router = express.Router()

function autoExpireAccepted(exchanges) {
  const now = Date.now()
  for (const ex of exchanges) {
    if (
      ex.status === 'accepted' &&
      ex.acceptedAt &&
      now - ex.acceptedAt > 86400000
    ) {
      ex.status = 'expired'
    }
  }
}

router.post('/', async (req, res) => {
  const db = getDB()
  const { itemId, message, requesterId, requesterName, requesterAvatar } = req.body

  const item = db.data.items.find(i => i.id === itemId)
  if (!item) {
    return res.status(404).json({ error: '物品不存在' })
  }

  if (item.userId === requesterId) {
    return res.status(400).json({ error: '不能交换自己的物品' })
  }

  const newExchange = {
    id: uuidv4(),
    itemId: item.id,
    itemTitle: item.title,
    itemImage: item.images && item.images.length > 0 ? item.images[0] : '',
    requesterId: requesterId || '',
    requesterName: requesterName || '',
    requesterAvatar: requesterAvatar || '',
    ownerId: item.userId,
    ownerName: item.userName,
    message: message || '',
    status: 'pending',
    createdAt: Date.now(),
    acceptedAt: null,
    completedAt: null,
    requesterRated: false,
    ownerRated: false
  }

  db.data.exchanges.push(newExchange)
  await db.write()
  res.status(201).json(newExchange)
})

router.get('/:userId', async (req, res) => {
  const db = getDB()
  const userId = req.params.userId

  autoExpireAccepted(db.data.exchanges)
  await db.write()

  const received = db.data.exchanges.filter(ex => ex.ownerId === userId)
  const sent = db.data.exchanges.filter(ex => ex.requesterId === userId)

  res.json({ received, sent })
})

router.post('/:id/action', async (req, res) => {
  const db = getDB()
  const exchange = db.data.exchanges.find(e => e.id === req.params.id)
  if (!exchange) {
    return res.status(404).json({ error: '交换请求不存在' })
  }

  const { action } = req.body

  if (action === 'accept') {
    if (exchange.status !== 'pending') {
      return res.status(400).json({ error: '当前状态无法接受' })
    }
    exchange.status = 'accepted'
    exchange.acceptedAt = Date.now()
  } else if (action === 'reject') {
    if (exchange.status !== 'pending') {
      return res.status(400).json({ error: '当前状态无法拒绝' })
    }
    exchange.status = 'rejected'
  } else if (action === 'complete') {
    if (exchange.status !== 'accepted') {
      return res.status(400).json({ error: '当前状态无法完成' })
    }
    exchange.status = 'completed'
    exchange.completedAt = Date.now()
  } else {
    return res.status(400).json({ error: '无效的操作类型' })
  }

  await db.write()
  res.json(exchange)
})

router.post('/:id/rate', async (req, res) => {
  const db = getDB()
  const exchange = db.data.exchanges.find(e => e.id === req.params.id)
  if (!exchange) {
    return res.status(404).json({ error: '交换请求不存在' })
  }

  if (exchange.status !== 'completed') {
    return res.status(400).json({ error: '交换未完成，无法评价' })
  }

  const { fromUserId, fromUserName, fromUserAvatar, toUserId, score, comment } = req.body

  if (fromUserId === exchange.requesterId) {
    if (exchange.requesterRated) {
      return res.status(400).json({ error: '请求方已评价' })
    }
    exchange.requesterRated = true
  } else if (fromUserId === exchange.ownerId) {
    if (exchange.ownerRated) {
      return res.status(400).json({ error: '物主方已评价' })
    }
    exchange.ownerRated = true
  } else {
    return res.status(400).json({ error: '非交换参与者无法评价' })
  }

  const newRating = {
    id: uuidv4(),
    exchangeId: exchange.id,
    fromUserId: fromUserId || '',
    fromUserName: fromUserName || '',
    fromUserAvatar: fromUserAvatar || '',
    toUserId: toUserId || '',
    score: score || 5,
    comment: comment || '',
    createdAt: Date.now()
  }

  db.data.ratings.push(newRating)
  await db.write()
  res.status(201).json(newRating)
})

router.get('/ratings/:userId', (req, res) => {
  const db = getDB()
  const userId = req.params.userId
  const ratings = db.data.ratings.filter(r => r.toUserId === userId)

  const totalCount = ratings.length
  const averageScore = totalCount > 0
    ? Math.round((ratings.reduce((sum, r) => sum + r.score, 0) / totalCount) * 10) / 10
    : 0

  ratings.sort((a, b) => b.createdAt - a.createdAt)
  res.json({ averageScore, totalCount, ratings })
})

export default router
