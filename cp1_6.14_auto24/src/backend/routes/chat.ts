import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../db'
import type { ChatMessage } from '../types'

const router = express.Router()

router.get('/:peerId', async (req, res) => {
  await db.read()
  const { peerId } = req.params
  const sessionUserId = req.session.userId

  if (!sessionUserId) {
    return res.status(401).json({ error: '请先登录' })
  }

  const messages = db.data.chatMessages
    .filter(
      m =>
        (m.fromUserId === sessionUserId && m.toUserId === peerId) ||
        (m.fromUserId === peerId && m.toUserId === sessionUserId)
    )
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  messages.forEach(m => {
    if (m.toUserId === sessionUserId) {
      m.read = true
    }
  })

  await db.write()

  res.json({ messages })
})

router.post('/:peerId', async (req, res) => {
  await db.read()
  const { peerId } = req.params
  const sessionUserId = req.session.userId

  if (!sessionUserId) {
    return res.status(401).json({ error: '请先登录' })
  }

  const { content } = req.body

  if (!content || !content.trim()) {
    return res.status(400).json({ error: '消息内容不能为空' })
  }

  const peer = db.data.users.find(u => u.id === peerId)
  if (!peer) {
    return res.status(404).json({ error: '对方用户不存在' })
  }

  const newMessage: ChatMessage = {
    id: uuidv4(),
    fromUserId: sessionUserId,
    toUserId: peerId,
    content: content.trim(),
    createdAt: new Date().toISOString(),
    read: false,
  }

  db.data.chatMessages.push(newMessage)
  await db.write()

  res.status(201).json({ message: newMessage })
})

router.get('/unread/count', async (req, res) => {
  await db.read()
  const sessionUserId = req.session.userId

  if (!sessionUserId) {
    return res.json({ count: 0 })
  }

  const count = db.data.chatMessages.filter(
    m => m.toUserId === sessionUserId && !m.read
  ).length

  res.json({ count })
})

export default router
