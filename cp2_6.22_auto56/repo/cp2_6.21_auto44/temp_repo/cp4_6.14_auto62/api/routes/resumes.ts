import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { resumes, jobs } from '../store.js'
import type { Resume } from '../../shared/types.js'

const router = Router()

function populateJobTitle(resume: Resume): Resume {
  const job = jobs.find((j) => j.id === resume.jobId)
  return { ...resume, jobTitle: job?.title ?? resume.jobTitle }
}

router.get('/', (_req: Request, res: Response): void => {
  const result = resumes.map(populateJobTitle)
  res.json({ success: true, data: result })
})

router.post('/', (req: Request, res: Response): void => {
  const { name, email, phone, jobId, fileName } = req.body

  if (!name || !email || !jobId) {
    res.status(400).json({ success: false, error: 'name, email, jobId are required' })
    return
  }

  const job = jobs.find((j) => j.id === jobId)

  const resume: Resume = {
    id: uuidv4(),
    name,
    email,
    phone: phone ?? '',
    jobId,
    jobTitle: job?.title ?? '',
    fileName: fileName ?? '',
    uploadedAt: new Date().toISOString(),
    status: 'pending',
    scores: [],
    averageScore: 0,
  }

  resumes.push(resume)
  res.status(201).json({ success: true, data: resume })
})

router.get('/:id', (req: Request, res: Response): void => {
  const resume = resumes.find((r) => r.id === req.params.id)

  if (!resume) {
    res.status(404).json({ success: false, error: 'Resume not found' })
    return
  }

  res.json({ success: true, data: populateJobTitle(resume) })
})

router.patch('/:id/status', (req: Request, res: Response): void => {
  const { status } = req.body
  const validStatuses: Resume['status'][] = ['pending', 'interviewed', 'hired', 'rejected']

  if (!status || !validStatuses.includes(status)) {
    res.status(400).json({
      success: false,
      error: `status is required and must be one of: ${validStatuses.join(', ')}`,
    })
    return
  }

  const resume = resumes.find((r) => r.id === req.params.id)

  if (!resume) {
    res.status(404).json({ success: false, error: 'Resume not found' })
    return
  }

  resume.status = status
  res.json({ success: true, data: resume })
})

export default router
