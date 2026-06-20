import express from 'express'
import cors from 'cors'
import { WebSocketServer, WebSocket } from 'ws'
import http from 'http'
import { v4 as uuidv4 } from 'uuid'
import {
  Activity,
  Coupon,
  PurchaseRecord,
  activities,
  coupons,
  purchaseRecords,
  users,
  getActivityStatus,
  getActivityRuleSummary
} from './data'

const app = express()
const server = http.createServer(app)
const wss = new WebSocketServer({ server, path: '/ws' })

app.use(cors())
app.use(express.json())

const userConnections = new Map<string, WebSocket>()

wss.on('connection', (ws) => {
  let currentUserId: string | null = null

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString())
      if (message.type === 'register' && message.userId) {
        currentUserId = message.userId
        userConnections.set(message.userId, ws)
      }
    } catch (e) {
      console.error('WebSocket message parse error:', e)
    }
  })

  ws.on('close', () => {
    if (currentUserId) {
      userConnections.delete(currentUserId)
    }
  })
})

function sendCouponToUser(userId: string, coupon: Coupon) {
  const ws = userConnections.get(userId)
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'new_coupon', coupon }))
    return true
  }
  return false
}

function checkAndIssueCoupon(userId: string, amount: number): Coupon | null {
  const ongoingActivities = activities.filter(a => getActivityStatus(a) === 'ongoing' && a.type === 'full_reduction')
  
  for (const activity of ongoingActivities) {
    if (activity.rules.fullAmount && amount >= activity.rules.fullAmount) {
      const existingCoupons = coupons.filter(
        c => c.userId === userId && c.activityId === activity.id && !c.used
      )
      
      if (existingCoupons.length === 0) {
        const coupon: Coupon = {
          id: uuidv4(),
          userId,
          activityId: activity.id,
          activityName: activity.name,
          type: activity.type,
          denomination: activity.rules.reductionAmount || 0,
          threshold: activity.rules.fullAmount || 0,
          expireTime: activity.endTime,
          used: false,
          issuedAt: new Date().toISOString()
        }
        coupons.push(coupon)
        sendCouponToUser(userId, coupon)
        return coupon
      }
    }
  }
  return null
}

function checkAndIssueEndingCoupons() {
  const now = Date.now()
  const threeDaysMs = 3 * 24 * 60 * 60 * 1000
  
  const endingActivities = activities.filter(a => {
    const status = getActivityStatus(a)
    const endTime = new Date(a.endTime).getTime()
    return status === 'ongoing' && (endTime - now) <= threeDaysMs && a.type === 'full_reduction'
  })
  
  for (const activity of endingActivities) {
    for (const user of users) {
      const usedCoupons = coupons.filter(
        c => c.userId === user.id && c.activityId === activity.id
      )
      
      if (usedCoupons.length === 0) {
        const coupon: Coupon = {
          id: uuidv4(),
          userId: user.id,
          activityId: activity.id,
          activityName: activity.name,
          type: activity.type,
          denomination: activity.rules.reductionAmount || 0,
          threshold: activity.rules.fullAmount || 0,
          expireTime: activity.endTime,
          used: false,
          issuedAt: new Date().toISOString()
        }
        coupons.push(coupon)
        sendCouponToUser(user.id, coupon)
      }
    }
  }
}

setInterval(checkAndIssueEndingCoupons, 60 * 1000)

app.get('/api/users', (_req, res) => {
  res.json(users)
})

app.get('/api/activities', (_req, res) => {
  res.json(activities.map(a => ({
    ...a,
    status: getActivityStatus(a),
    ruleSummary: getActivityRuleSummary(a)
  })))
})

app.post('/api/activities', (req, res) => {
  const body = req.body as Omit<Activity, 'id'>
  
  if (!body.name || !body.type || !body.startTime || !body.endTime) {
    return res.status(400).json({ error: '缺少必填字段' })
  }
  
  const newActivity: Activity = {
    id: uuidv4(),
    ...body
  }
  
  activities.push(newActivity)
  res.status(201).json(newActivity)
})

app.put('/api/activities/:id', (req, res) => {
  const { id } = req.params
  const index = activities.findIndex(a => a.id === id)
  
  if (index === -1) {
    return res.status(404).json({ error: '活动不存在' })
  }
  
  activities[index] = { ...activities[index], ...req.body }
  res.json(activities[index])
})

app.delete('/api/activities/:id', (req, res) => {
  const { id } = req.params
  const index = activities.findIndex(a => a.id === id)
  
  if (index === -1) {
    return res.status(404).json({ error: '活动不存在' })
  }
  
  activities.splice(index, 1)
  res.json({ success: true })
})

app.get('/api/users/:userId/purchases', (req, res) => {
  const { userId } = req.params
  const days = parseInt(req.query.days as string) || 30
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)
  
  const userRecords = purchaseRecords.filter(
    r => r.userId === userId && new Date(r.date) >= cutoffDate
  )
  res.json(userRecords)
})

app.post('/api/users/:userId/purchases', (req, res) => {
  const { userId } = req.params
  const body = req.body as Omit<PurchaseRecord, 'id' | 'userId' | 'date'>
  
  const record: PurchaseRecord = {
    id: uuidv4(),
    userId,
    date: new Date().toISOString().split('T')[0],
    amount: body.amount,
    category: body.category
  }
  
  purchaseRecords.push(record)
  
  const issuedCoupon = checkAndIssueCoupon(userId, body.amount)
  
  res.status(201).json({
    purchase: record,
    coupon: issuedCoupon
  })
})

app.get('/api/users/:userId/coupons', (req, res) => {
  const { userId } = req.params
  const userCoupons = coupons.filter(c => c.userId === userId)
  res.json(userCoupons)
})

app.post('/api/coupons/:couponId/use', (req, res) => {
  const { couponId } = req.params
  const coupon = coupons.find(c => c.id === couponId)
  
  if (!coupon) {
    return res.status(404).json({ error: '优惠券不存在' })
  }
  
  if (coupon.used) {
    return res.status(400).json({ error: '优惠券已使用' })
  }
  
  if (new Date(coupon.expireTime) < new Date()) {
    return res.status(400).json({ error: '优惠券已过期' })
  }
  
  coupon.used = true
  res.json({ success: true, coupon })
})

const PORT = 3002
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`WebSocket server running on ws://localhost:${PORT}/ws`)
})
