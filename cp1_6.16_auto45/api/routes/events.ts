import { Router, type Request, type Response } from 'express'
import { getAllEvents, getEventById, createEvent, getEventsByArtist } from '../services/eventService.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { keyword, dateFrom, dateTo } = req.query as Record<string, string>
  const events = getAllEvents({ keyword, dateFrom, dateTo })
  res.json({ success: true, data: events })
})

router.get('/:id', (req: Request, res: Response): void => {
  const event = getEventById(req.params.id)
  if (!event) {
    res.status(404).json({ success: false, error: '活动不存在' })
    return
  }
  res.json({ success: true, data: event })
})

router.post('/', (req: Request, res: Response): void => {
  const { name, posterUrl, date, venue, tiers, tracks, artistBio } = req.body
  if (!name || !date || !venue || !tiers) {
    res.status(400).json({ success: false, error: '缺少必要字段' })
    return
  }
  const event = createEvent({
    name,
    posterUrl: posterUrl || '',
    date,
    venue,
    tiers,
    tracks: tracks || [],
    artistBio: artistBio || '',
    artistId: req.body.artistId || 'u1',
  })
  res.status(201).json({ success: true, data: event })
})

router.get('/artist/:artistId', (req: Request, res: Response): void => {
  const events = getEventsByArtist(req.params.artistId)
  res.json({ success: true, data: events })
})

export default router
