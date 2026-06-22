import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { interviews, getOccupiedSlots } from '../store.js'
import type { Interview } from '../../shared/types.js'

const router = Router()

router.get('/', (_req: Request, res: Response): void => {
  res.json({ success: true, data: interviews })
})

router.post('/', (req: Request, res: Response): void => {
  const { resumeId, candidateName, jobTitle, date, timeSlot } = req.body

  if (!resumeId || !candidateName || !date || !timeSlot) {
    res.status(400).json({ success: false, error: 'resumeId, candidateName, date, timeSlot are required' })
    return
  }

  const interview: Interview = {
    id: uuidv4(),
    resumeId,
    candidateName,
    jobTitle: jobTitle ?? '',
    date,
    timeSlot,
    status: 'scheduled',
  }

  interviews.push(interview)
  res.status(201).json({ success: true, data: interview })
})

router.get('/slots', (req: Request, res: Response): void => {
  const date = req.query.date as string

  if (!date) {
    res.status(400).json({ success: false, error: 'date query parameter is required' })
    return
  }

  const occupiedSlots = getOccupiedSlots(date)
  res.json({ success: true, data: occupiedSlots })
})

export default router
