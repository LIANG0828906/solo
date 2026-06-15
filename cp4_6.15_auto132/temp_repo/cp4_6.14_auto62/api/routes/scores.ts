import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { scores, resumes } from '../store.js'
import type { Score } from '../../shared/types.js'

const router = Router()

router.post('/', (req: Request, res: Response): void => {
  const { resumeId, interviewer, rating, comment } = req.body

  if (!resumeId || !interviewer || rating === undefined) {
    res.status(400).json({ success: false, error: 'resumeId, interviewer, rating are required' })
    return
  }

  const score: Score = {
    id: uuidv4(),
    resumeId,
    interviewer,
    rating,
    comment: comment ?? '',
    createdAt: new Date().toISOString(),
  }

  scores.push(score)

  const resume = resumes.find((r) => r.id === resumeId)
  if (resume) {
    resume.scores.push(score)
    const total = resume.scores.reduce((sum: number, s: Score) => sum + s.rating, 0)
    resume.averageScore = Math.round((total / resume.scores.length) * 100) / 100
  }

  res.status(201).json({ success: true, data: score })
})

router.get('/resume/:resumeId', (req: Request, res: Response): void => {
  const resumeScores = scores.filter((s) => s.resumeId === req.params.resumeId)
  res.json({ success: true, data: resumeScores })
})

export default router
