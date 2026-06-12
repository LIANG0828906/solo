import { Router, type Request, type Response } from 'express'
import {
  getAllCards,
  getCardById,
  createCard,
  updateCard,
  deleteCard,
  getRecommendations,
  addEdge,
  getGraphData,
  getAllTags,
} from '../cardStore.js'

const router = Router()

router.get('/cards', (req: Request, res: Response): void => {
  const cards = getAllCards()
  res.json({ success: true, data: cards })
})

router.get('/cards/:id', (req: Request, res: Response): void => {
  const card = getCardById(req.params.id)
  if (!card) {
    res.status(404).json({ success: false, error: 'Card not found' })
    return
  }
  res.json({ success: true, data: card })
})

router.post('/cards', (req: Request, res: Response): void => {
  const { title, tags, body } = req.body
  if (!title || !body) {
    res.status(400).json({ success: false, error: 'Title and body are required' })
    return
  }
  const card = createCard({ title, tags: tags || [], body })
  res.status(201).json({ success: true, data: card })
})

router.put('/cards/:id', (req: Request, res: Response): void => {
  const card = updateCard(req.params.id, req.body)
  if (!card) {
    res.status(404).json({ success: false, error: 'Card not found' })
    return
  }
  res.json({ success: true, data: card })
})

router.delete('/cards/:id', (req: Request, res: Response): void => {
  const deleted = deleteCard(req.params.id)
  if (!deleted) {
    res.status(404).json({ success: false, error: 'Card not found' })
    return
  }
  res.json({ success: true, message: 'Card deleted' })
})

router.get('/cards/:id/recommendations', (req: Request, res: Response): void => {
  const recs = getRecommendations(req.params.id)
  res.json({ success: true, data: recs })
})

router.post('/edges', (req: Request, res: Response): void => {
  const { source, target, weight } = req.body
  if (!source || !target || weight == null) {
    res.status(400).json({ success: false, error: 'source, target, and weight are required' })
    return
  }
  const edge = addEdge(source, target, weight)
  res.status(201).json({ success: true, data: edge })
})

router.get('/graph', (req: Request, res: Response): void => {
  const graph = getGraphData()
  res.json({ success: true, data: graph })
})

router.get('/tags', (req: Request, res: Response): void => {
  const tags = getAllTags()
  res.json({ success: true, data: tags })
})

export default router
