import { Router, type Request, type Response } from 'express'
import {
  getAllDecisions,
  getDecisionById,
  createDecision,
  updateDecision,
  deleteDecision,
  addComment,
  togglePin,
} from '../data/store.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const decisions = getAllDecisions()
    res.json({ success: true, data: decisions })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server internal error' })
  }
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, type, author } = req.body
    if (!title || !description || !type || !author) {
      res.status(400).json({ success: false, error: 'Missing required fields: title, description, type, author' })
      return
    }
    if (!['technical', 'design', 'management'].includes(type)) {
      res.status(400).json({ success: false, error: 'Invalid type, must be technical, design, or management' })
      return
    }
    const decision = createDecision({ title, description, type, author })
    res.status(201).json({ success: true, data: decision })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server internal error' })
  }
})

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { title, description, type } = req.body
    if (type && !['technical', 'design', 'management'].includes(type)) {
      res.status(400).json({ success: false, error: 'Invalid type, must be technical, design, or management' })
      return
    }
    const decision = updateDecision(id, { title, description, type })
    if (!decision) {
      res.status(404).json({ success: false, error: 'Decision not found' })
      return
    }
    res.json({ success: true, data: decision })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server internal error' })
  }
})

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const deleted = deleteDecision(id)
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Decision not found' })
      return
    }
    res.json({ success: true, data: null })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server internal error' })
  }
})

router.post('/:id/comments', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { author, content } = req.body
    if (!author || !content) {
      res.status(400).json({ success: false, error: 'Missing required fields: author, content' })
      return
    }
    const decision = addComment(id, { author, content })
    if (!decision) {
      res.status(404).json({ success: false, error: 'Decision not found' })
      return
    }
    res.status(201).json({ success: true, data: decision })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server internal error' })
  }
})

router.post('/:id/pin', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const decision = togglePin(id)
    if (!decision) {
      res.status(404).json({ success: false, error: 'Decision not found' })
      return
    }
    res.json({ success: true, data: decision })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server internal error' })
  }
})

export default router
