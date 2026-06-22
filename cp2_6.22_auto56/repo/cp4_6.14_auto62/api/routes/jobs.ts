import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { jobs } from '../store.js'
import type { Job } from '../../shared/types.js'

const router = Router()

router.get('/', (_req: Request, res: Response): void => {
  res.json({ success: true, data: jobs })
})

router.post('/', (req: Request, res: Response): void => {
  const { title, department, location, salaryMin, salaryMax, description } = req.body

  if (!title || !department || !location) {
    res.status(400).json({ success: false, error: 'title, department, location are required' })
    return
  }

  const job: Job = {
    id: uuidv4(),
    title,
    department,
    location,
    salaryMin: salaryMin ?? 0,
    salaryMax: salaryMax ?? 0,
    description: description ?? '',
    createdAt: new Date().toISOString(),
  }

  jobs.push(job)
  res.status(201).json({ success: true, data: job })
})

router.get('/:id', (req: Request, res: Response): void => {
  const job = jobs.find((j) => j.id === req.params.id)

  if (!job) {
    res.status(404).json({ success: false, error: 'Job not found' })
    return
  }

  res.json({ success: true, data: job })
})

export default router
