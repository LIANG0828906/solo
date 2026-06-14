import { Router, type Request, type Response } from 'express'
import { dataStore } from '../models/dataStore.js'

const router = Router()

router.get('/', (_req: Request, res: Response): void => {
  const events = dataStore.events.getAll()
  const enriched = events.map(e => {
    const book = dataStore.books.getById(e.bookId)
    return { ...e, bookTitle: book?.title }
  })
  res.json({ success: true, data: enriched })
})

router.post('/', (req: Request, res: Response): void => {
  const { bookId, chapterRange, suggestedTime, adjustedTime, status } = req.body
  if (!bookId || !chapterRange || !suggestedTime) {
    res.status(400).json({ success: false, error: 'bookId, chapterRange and suggestedTime are required' })
    return
  }
  const event = dataStore.events.create({
    bookId,
    chapterRange,
    suggestedTime,
    adjustedTime: adjustedTime || suggestedTime,
    status: status || 'suggested',
  })
  const book = dataStore.books.getById(bookId)
  res.status(201).json({ success: true, data: { ...event, bookTitle: book?.title } })
})

router.get('/:id', (req: Request, res: Response): void => {
  const event = dataStore.events.getById(req.params.id)
  if (!event) {
    res.status(404).json({ success: false, error: 'Event not found' })
    return
  }
  const book = dataStore.books.getById(event.bookId)
  const eventVotes = dataStore.votes.getByEventId(event.id)
  res.json({ success: true, data: { ...event, bookTitle: book?.title, votes: eventVotes } })
})

router.post('/:id/vote', (req: Request, res: Response): void => {
  const { memberId, timeOption } = req.body
  if (!memberId || !timeOption) {
    res.status(400).json({ success: false, error: 'memberId and timeOption are required' })
    return
  }
  const event = dataStore.events.getById(req.params.id)
  if (!event) {
    res.status(404).json({ success: false, error: 'Event not found' })
    return
  }
  const vote = dataStore.votes.create({ eventId: req.params.id, memberId, timeOption })
  res.status(201).json({ success: true, data: vote })
})

router.get('/:id/votes', (req: Request, res: Response): void => {
  const event = dataStore.events.getById(req.params.id)
  if (!event) {
    res.status(404).json({ success: false, error: 'Event not found' })
    return
  }
  const eventVotes = dataStore.votes.getByEventId(req.params.id)
  const tally: Record<string, { count: number; members: { id: string; name: string }[] }> = {}
  for (const v of eventVotes) {
    if (!tally[v.timeOption]) tally[v.timeOption] = { count: 0, members: [] }
    tally[v.timeOption].count++
    const member = dataStore.members.getById(v.memberId)
    if (member) tally[v.timeOption].members.push({ id: member.id, name: member.name })
  }
  res.json({ success: true, data: { eventId: req.params.id, tally } })
})

export default router
