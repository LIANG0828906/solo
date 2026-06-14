import { Router, type Request, type Response } from 'express'
import { dataStore } from '../models/dataStore.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const bookId = req.query.bookId as string | undefined
  const result = dataStore.topics.getAll(bookId)
  const enriched = result.map(t => {
    const creator = dataStore.members.getById(t.creatorId)
    const book = dataStore.books.getById(t.bookId)
    return { ...t, creatorName: creator?.name, bookTitle: book?.title }
  })
  res.json({ success: true, data: enriched })
})

router.post('/', (req: Request, res: Response): void => {
  const { bookId, title, creatorId } = req.body
  if (!bookId || !title || !creatorId) {
    res.status(400).json({ success: false, error: 'bookId, title and creatorId are required' })
    return
  }
  const topic = dataStore.topics.create({ bookId, title, creatorId })
  const creator = dataStore.members.getById(creatorId)
  res.status(201).json({ success: true, data: { ...topic, creatorName: creator?.name } })
})

router.get('/:topicId', (req: Request, res: Response): void => {
  const topic = dataStore.topics.getById(req.params.topicId)
  if (!topic) {
    res.status(404).json({ success: false, error: 'Topic not found' })
    return
  }
  const creator = dataStore.members.getById(topic.creatorId)
  const book = dataStore.books.getById(topic.bookId)
  const replies = dataStore.replies.getByTopicId(topic.id).map(r => {
    const member = dataStore.members.getById(r.memberId)
    return { ...r, memberName: member?.name, memberAvatar: member?.avatar }
  })
  res.json({
    success: true,
    data: {
      ...topic,
      creatorName: creator?.name,
      bookTitle: book?.title,
      replies,
    },
  })
})

router.post('/:topicId/replies', (req: Request, res: Response): void => {
  const { memberId, content, mentionIds } = req.body
  if (!memberId || !content) {
    res.status(400).json({ success: false, error: 'memberId and content are required' })
    return
  }
  const topic = dataStore.topics.getById(req.params.topicId)
  if (!topic) {
    res.status(404).json({ success: false, error: 'Topic not found' })
    return
  }
  const reply = dataStore.replies.create({
    topicId: req.params.topicId,
    memberId,
    content,
    mentionIds: mentionIds || [],
  })
  const member = dataStore.members.getById(memberId)
  res.status(201).json({ success: true, data: { ...reply, memberName: member?.name, memberAvatar: member?.avatar } })
})

router.get('/:topicId/replies', (req: Request, res: Response): void => {
  const topic = dataStore.topics.getById(req.params.topicId)
  if (!topic) {
    res.status(404).json({ success: false, error: 'Topic not found' })
    return
  }
  const replies = dataStore.replies.getByTopicId(req.params.topicId).map(r => {
    const member = dataStore.members.getById(r.memberId)
    return { ...r, memberName: member?.name, memberAvatar: member?.avatar }
  })
  res.json({ success: true, data: replies })
})

export default router
