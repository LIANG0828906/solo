import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'

interface Exhibition {
  id: string
  name: string
  workIds: string[]
  createdAt: string
}

const exhibitions: Exhibition[] = []

const router = Router()

router.post('/', (req: Request, res: Response): void => {
  const { name, workIds } = req.body

  if (!workIds || !Array.isArray(workIds) || workIds.length < 4) {
    res.status(400).json({ success: false, error: 'At least 4 works are required' })
    return
  }

  const exhibition: Exhibition = {
    id: uuidv4(),
    name: name || '未命名展览',
    workIds,
    createdAt: new Date().toISOString(),
  }

  exhibitions.push(exhibition)
  res.status(201).json({ success: true, data: exhibition })
})

router.get('/:id', (req: Request, res: Response): void => {
  const exhibition = exhibitions.find(e => e.id === req.params.id)
  if (!exhibition) {
    res.status(404).json({ success: false, error: 'Exhibition not found' })
    return
  }
  res.json({ success: true, data: exhibition })
})

router.get('/', (req: Request, res: Response): void => {
  res.json({ success: true, data: exhibitions })
})

export default router
